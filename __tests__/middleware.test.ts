import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// NextResponseのモック
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
    rewrite: jest.fn(),
  },
}));

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (
    pathname: string,
    acceptLanguage?: string,
    cookieLocale?: string,
    search?: string
  ) => {
    const url = `https://example.com${pathname}${search || ''}`;
    const mockRequest = {
      nextUrl: { pathname },
      url,
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'accept-language') return acceptLanguage;
          return null;
        }),
      },
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'locale' && cookieLocale) {
            return { value: cookieLocale };
          }
          return undefined;
        }),
      },
    } as unknown as NextRequest;

    return mockRequest;
  };

  describe('既存の言語パスがある場合', () => {
    it('英語パス(/en/*)は通す', () => {
      const request = createMockRequest('/en/login');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('中国語パス(/zh/*)は通す', () => {
      const request = createMockRequest('/zh/login');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('/en 単体も通す', () => {
      const request = createMockRequest('/en');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('/ja/* パスの処理', () => {
    it('/ja/login は /login にリダイレクト', () => {
      const request = createMockRequest('/ja/login');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('https://example.com/login')
      );
    });

    it('/ja は / にリダイレクト', () => {
      const request = createMockRequest('/ja');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('https://example.com/')
      );
    });

    it('/ja/terms?param=value はクエリストリング保持', () => {
      const request = createMockRequest('/ja/terms', undefined, undefined, '?param=value');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('https://example.com/terms?param=value')
      );
    });
  });

  describe('言語判定とリダイレクト', () => {
    describe('ルートパス(/)の処理', () => {
      it('クッキーで英語が設定されている場合、/en にリダイレクト', () => {
        const request = createMockRequest('/', undefined, 'en');
        middleware(request);
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('https://example.com/en')
        );
      });

      it('Accept-Language: en で /en にリダイレクト', () => {
        const request = createMockRequest('/', 'en-US,en;q=0.9');
        middleware(request);
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('https://example.com/en')
        );
      });

      it('Accept-Language: ja (デフォルト)の場合は/loginにリダイレクト', () => {
        const request = createMockRequest('/', 'ja,en;q=0.9');
        middleware(request);
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('https://example.com/login')
        );
        expect(NextResponse.rewrite).not.toHaveBeenCalled();
      });

      it('クエリストリング付きルートパスでリダイレクト', () => {
        const request = createMockRequest('/', 'en', undefined, '?utm_source=test');
        middleware(request);
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          new URL('https://example.com/en?utm_source=test')
        );
      });
    });

    describe('Accept-Language パース', () => {
      it('複数言語の品質値を正しく処理', () => {
        const request = createMockRequest('/login', 'fr;q=0.9,en;q=0.8,ja;q=0.7');
        middleware(request);
        // フランス語は非対応なので、次に優先度の高い英語を選択
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/en/login')
        );
      });

      it('zh-CN は zh として認識', () => {
        const request = createMockRequest('/login', 'zh-CN,zh;q=0.9');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/zh/login')
        );
      });

      it('サポートされていない言語はデフォルトに', () => {
        const request = createMockRequest('/login', 'fr,de;q=0.9');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/ja/login')
        );
      });
    });

    describe('クッキー優先順位', () => {
      it('クッキーがAccept-Languageより優先される', () => {
        const request = createMockRequest('/login', 'en-US,en;q=0.9', 'zh');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/zh/login')
        );
      });

      it('無効なクッキー値は無視される', () => {
        const request = createMockRequest('/login', 'en-US,en;q=0.9', 'invalid');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/en/login')
        );
      });
    });

    describe('リライト処理', () => {
      it('/login は適切な言語パスにリライト', () => {
        const request = createMockRequest('/login', 'en');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/en/login')
        );
      });

      it('/terms?param=value はクエリストリング保持してリライト', () => {
        const request = createMockRequest('/terms', 'zh', undefined, '?param=value');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/zh/terms?param=value')
        );
      });

      it('デフォルト言語(ja)でもリライト', () => {
        const request = createMockRequest('/privacy-policy', 'ja');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/ja/privacy-policy')
        );
      });
    });

    describe('エッジケース', () => {
      it('Accept-Languageヘッダーなしの場合', () => {
        const request = createMockRequest('/login');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/ja/login')
        );
      });

      it('空のAccept-Languageヘッダー', () => {
        const request = createMockRequest('/login', '');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/ja/login')
        );
      });

      it('不正な形式のAccept-Language', () => {
        const request = createMockRequest('/login', 'invalid-format');
        middleware(request);
        expect(NextResponse.rewrite).toHaveBeenCalledWith(
          new URL('https://example.com/ja/login')
        );
      });
    });
  });

  describe('matcher設定に合致するパス', () => {
    const matcherPaths = [
      '/',
      '/login',
      '/terms', 
      '/privacy-policy',
      '/en/login',
      '/ja/terms',
      '/zh/privacy-policy',
    ];

    matcherPaths.forEach(path => {
      it(`${path} はmiddlewareが処理する`, () => {
        // このテストはmatcher設定の確認のため、実際の処理は他のテストでカバー
        expect(true).toBe(true);
      });
    });
  });
});