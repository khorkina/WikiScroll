import React, { useState, useEffect, useCallback } from 'react';
import { Book, Globe, ChevronDown } from 'lucide-react';

interface WikiArticle {
  title: string;
  extract: string;
  thumbnail: string;
  fullurl: string;
}

function Section({ article, language, setLanguage }: { article: WikiArticle, language: string, setLanguage: (lang: string) => void }) {
  return (
    <div className="h-screen w-full snap-section relative overflow-hidden">
      <img
        src={article.thumbnail}
        alt={article.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 gradient-overlay">
        <div className="h-full flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-white mr-3" />
              <h1 className="text-2xl font-bold text-white">WikiScroll</h1>
            </div>
            <select 
              className="px-4 py-2 rounded bg-white text-black" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div className="max-w-2xl mx-auto text-center flex flex-col justify-center h-[calc(100vh-200px)]">
            <h2 className="text-4xl font-bold text-white mb-4">{article.title}</h2>
            <div className="flex-1 overflow-y-auto mb-6 px-4">
              <p className="text-lg text-white/90 leading-relaxed backdrop-blur-sm bg-black/30 p-6 rounded-xl">
                {article.extract}
              </p>
            </div>
            <div className="mt-auto">
              <a 
                href={article.fullurl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white/10 backdrop-blur-lg text-white rounded-full hover:bg-white/20 transition-colors inline-block"
              >
                Read full article
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <ChevronDown className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [language, setLanguage] = useState('en');

  const fetchArticles = useCallback(async () => {
    try {
      const apiUrl = `https://${language}.wikipedia.org/w/api.php`;
      const params = {
        origin: '*',
        action: 'query',
        format: 'json',
        generator: 'random',
        grnnamespace: '0',
        grnlimit: '10',
        prop: 'extracts|pageimages|info',
        exintro: '1',
        explaintext: '1',
        inprop: 'url',
        piprop: 'original'
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const response = await fetch(`${apiUrl}?${queryString}`);
      const data = await response.json();
      
      if (!data.query || !data.query.pages) {
        throw new Error('Invalid API response');
      }

      const pages = Object.values(data.query.pages);
      const filteredArticles = pages
        .filter((page: any) => page.original?.source)
        .map((page: any) => ({
          title: page.title,
          extract: page.extract,
          thumbnail: page.original.source,
          fullurl: page.fullurl
        }));

      return filteredArticles;
    } catch (error) {
      console.error('Error fetching Wikipedia articles:', error);
      return [];
    }
  }, [language]);

  const loadMoreArticles = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const newArticles = await fetchArticles();
    setArticles(prev => [...prev, ...newArticles]);
    setLoadingMore(false);
  }, [fetchArticles, loadingMore]);

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      const initialArticles = await fetchArticles();
      setArticles(initialArticles);
      setLoading(false);
    }
    initialLoad();
  }, [fetchArticles, language]);

  useEffect(() => {
    function handleScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMoreArticles();
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreArticles]);

  return (
    <div className="bg-black">
      {articles.map((article, index) => (
        <Section key={`${article.title}-${index}`} article={article} language={language} setLanguage={setLanguage} />
      ))}
      {loadingMore && (
        <div className="h-screen w-full flex items-center justify-center bg-black">
          <div className="text-white text-xl">Loading more articles...</div>
        </div>
      )}
    </div>
  );
}

export default App;
