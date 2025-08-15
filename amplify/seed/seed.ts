import { DynamoDBClient, PutItemCommand, ScanCommand, DeleteItemCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import characterList from './character-list.json';

interface Character {
  name: string;
  icon: string;
  order: number;
}

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const PROFILE = process.env.AWS_PROFILE || 'default';
const ENV = process.env.ENV || 'dev';

const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: PROFILE !== 'default' ? fromIni({ profile: PROFILE }) : undefined,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

async function findCharacterTable(): Promise<string> {
  console.log('🔍 Searching for DynamoDB tables...');
  
  try {
    if (process.env.CHARACTER_TABLE) {
      console.log(`📋 Using table from environment: ${process.env.CHARACTER_TABLE}`);
      return process.env.CHARACTER_TABLE;
    }
    
    try {
      const amplifyOutputs = JSON.parse(readFileSync(join(process.cwd(), 'amplify_outputs.json'), 'utf-8'));
      if (amplifyOutputs.data?.character_table) {
        console.log(`📋 Found table from amplify_outputs.json: ${amplifyOutputs.data.character_table}`);
        return amplifyOutputs.data.character_table;
      }
    } catch (e) {
      // amplify_outputs.json not found or doesn't have the table info
    }
    
    const listTablesCommand = new ListTablesCommand({});
    const tables = await dynamoClient.send(listTablesCommand);
    
    console.log('📋 Available tables:');
    tables.TableNames?.forEach((table, index) => {
      console.log(`  [${index}] ${table}`);
    });
    
    const characterTables = tables.TableNames?.filter(name => {
      const lowerName = name.toLowerCase();
      return lowerName.includes('character') && 
             !lowerName.includes('category') && 
             !lowerName.includes('user') &&
             !lowerName.includes('setting');
    }) || [];
    
    if (characterTables.length === 0) {
      console.log('⚠️  No Character table found automatically.');
      
      if (process.env.NON_INTERACTIVE === 'true') {
        throw new Error('No Character table found. Please specify CHARACTER_TABLE environment variable.');
      }
      
      const index = await question('Enter the number of the table to use for characters: ');
      const selectedIndex = parseInt(index);
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= (tables.TableNames?.length || 0)) {
        throw new Error('Invalid table selection');
      }
      
      return tables.TableNames![selectedIndex];
    } else if (characterTables.length === 1) {
      console.log(`✅ Auto-detected Character table: ${characterTables[0]}`);
      return characterTables[0];
    } else {
      console.log('🔍 Multiple Character tables found:');
      characterTables.forEach((table) => {
        console.log(`  - ${table}`);
      });
      
      if (process.env.NON_INTERACTIVE === 'true' || process.env.AUTO_SELECT === 'true') {
        const selected = characterTables[characterTables.length - 1];
        console.log(`✅ Auto-selecting most recent table: ${selected}`);
        return selected;
      }
      
      characterTables.forEach((table, index) => {
        console.log(`  [${index}] ${table}`);
      });
      
      const index = await question('Select the table number to use: ');
      const selectedIndex = parseInt(index);
      
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= characterTables.length) {
        throw new Error('Invalid table selection');
      }
      
      return characterTables[selectedIndex];
    }
  } catch (error) {
    console.error('❌ Error finding tables:', error);
    throw error;
  }
}

async function checkExistingData(tableName: string): Promise<boolean> {
  console.log('📊 Checking existing data...');
  
  try {
    const scanCommand = new ScanCommand({
      TableName: tableName,
    });
    
    const result = await dynamoClient.send(scanCommand);
    console.log(`Found ${result.Count || 0} existing characters`);
    
    if (result.Count && result.Count > 0) {
      if (process.env.NON_INTERACTIVE === 'true' || process.env.AUTO_SELECT === 'true') {
        if (process.env.OVERWRITE === 'true') {
          console.log('⚠️  Table has existing data. Overwriting as per OVERWRITE=true flag');
        } else {
          console.log('⚠️  Table has existing data. Skipping (set OVERWRITE=true to overwrite)');
          return false;
        }
      } else {
        const answer = await question('⚠️  Table has existing data. Overwrite? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          console.log('❌ Seeding cancelled');
          return false;
        }
      }
      
      console.log('🗑️  Deleting existing data...');
      if (result.Items) {
        for (const item of result.Items) {
          const deleteCommand = new DeleteItemCommand({
            TableName: tableName,
            Key: {
              id: item.id,
            },
          });
          await dynamoClient.send(deleteCommand);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking existing data:', error);
    throw error;
  }
}

async function seedCharacters(tableName: string): Promise<void> {
  console.log(`\n📝 Seeding ${characterList.length} characters to ${tableName}...`);
  
  const timestamp = new Date().toISOString();
  let successCount = 0;
  
  for (const character of characterList as Character[]) {
    const id = String(character.order).padStart(3, '0');
    
    try {
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          name: { S: character.name },
          icon: { S: character.icon },
          order: { N: String(character.order) },
          createdAt: { S: timestamp },
          updatedAt: { S: timestamp },
        },
      });
      
      await dynamoClient.send(putCommand);
      console.log(`✅ [${id}] ${character.name}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to seed ${character.name}:`, error.message);
    }
  }
  
  console.log(`\n✨ Seeding completed! ${successCount}/${characterList.length} characters created successfully`);
}

async function main(): Promise<void> {
  console.log('🎮 Super Smash Bros Character Seeder');
  console.log(`📍 Region: ${REGION}, Profile: ${PROFILE}, Environment: ${ENV}\n`);
  
  try {
    const tableName = await findCharacterTable();
    console.log(`\n🎯 Using table: ${tableName}`);
    
    const shouldContinue = await checkExistingData(tableName);
    if (!shouldContinue) {
      rl.close();
      return;
    }
    
    await seedCharacters(tableName);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Always run when this file is executed
main().catch(console.error);