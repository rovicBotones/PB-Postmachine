import { getAllData } from "utils/posts.service";
import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/article.$id";
import dayjs from "dayjs";

export function meta({ loaderData }: Route.MetaArgs) {
  const article = loaderData?.article;
  return [{ title: article ? `${article.Title} - Peoples Balita` : 'Article - Peoples Balita' }];
}

export type News = {
  Id: string;
  Date: string;
  Category: string;
  Title: string;
  Author: string;
  Status: string;
  Content: string;
  FeaturedImage?: string;
};

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  try {
    const articleId = params.id || '';

    // Dummy data for testing
    const dummyData: News[] = [
      {
        Id: "1",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Headlines",
        Title: "Mayor Announces New Infrastructure Projects for Manila",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "Manila's mayor unveiled a comprehensive infrastructure development plan that includes the construction of new roads, bridges, and public facilities. The multi-billion peso project aims to improve transportation and enhance the quality of life for residents across the city.",
        FeaturedImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop"
      },
      {
        Id: "2",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Headlines",
        Title: "Philippine Economy Shows Strong Growth in Q4",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "The Philippine economy recorded impressive growth rates in the fourth quarter, driven by robust consumer spending and increased business investments. Economists predict continued positive momentum in the coming months.",
        FeaturedImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop"
      },
      {
        Id: "3",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Headlines",
        Title: "New Education Program Launches Nationwide",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "The Department of Education introduced a groundbreaking program aimed at improving literacy rates and digital skills among students. The initiative will be rolled out in schools across the country starting next month.",
        FeaturedImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop"
      },
      {
        Id: "4",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Sports",
        Title: "Gilas Pilipinas Wins Championship Game",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "The Philippine national basketball team claimed victory in a thrilling championship match, defeating their rivals in overtime. The win marks a significant achievement for Philippine basketball on the international stage.",
        FeaturedImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop"
      },
      {
        Id: "5",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Sports",
        Title: "Filipino Boxer Prepares for World Title Fight",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "A rising Filipino boxing star is set to challenge for the world championship title next month. The fighter has been training intensively and expressed confidence about bringing home the belt.",
        FeaturedImage: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=600&fit=crop"
      },
      {
        Id: "6",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Showbiz",
        Title: "New Filipino Film Wins International Award",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "A Filipino independent film received critical acclaim at a prestigious international film festival, earning top honors for its compelling storytelling and exceptional cinematography. The director dedicated the award to Filipino filmmakers.",
        FeaturedImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=600&fit=crop"
      },
      {
        Id: "7",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Showbiz",
        Title: "Popular TV Series Returns for New Season",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "Fans rejoice as one of the country's most beloved television dramas announces its return for another season. The show's producers promise exciting plot twists and new characters that will keep viewers on the edge of their seats.",
        FeaturedImage: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=600&fit=crop"
      },
      {
        Id: "8",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Contributors",
        Title: "Climate Action: Our Shared Responsibility",
        Author: "Dr. Maria Santos",
        Status: "Published",
        Content: "As we face the growing challenges of climate change, it's crucial that every Filipino takes part in environmental conservation efforts. Small actions in our daily lives can lead to significant positive impacts on our planet's future.",
        FeaturedImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"
      },
      {
        Id: "9",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Contributors",
        Title: "The Future of Philippine Agriculture",
        Author: "Juan dela Cruz",
        Status: "Published",
        Content: "Modern farming techniques and sustainable practices are transforming Philippine agriculture. By embracing innovation while respecting traditional methods, we can ensure food security for future generations.",
        FeaturedImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop"
      },
      {
        Id: "10",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Editorial",
        Title: "Investing in Our Youth: A National Priority",
        Author: "Peoples Balita Editorial Board",
        Status: "Published",
        Content: "The government's commitment to education and youth development programs represents a crucial investment in the nation's future. We must continue to prioritize initiatives that empower the next generation of Filipino leaders.",
        FeaturedImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop"
      },
      {
        Id: "11",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Subheadlines",
        Title: "Traffic Management System Upgrade Announced",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "Metropolitan Manila Development Authority unveils plans for a comprehensive traffic management system upgrade, incorporating smart technology to reduce congestion.",
        FeaturedImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop"
      },
      {
        Id: "12",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Subheadlines",
        Title: "Local Food Festival Celebrates Filipino Cuisine",
        Author: "Peoples Balita",
        Status: "Published",
        Content: "This weekend's food festival showcases the rich diversity of Filipino culinary traditions, featuring dishes from different regions across the archipelago.",
        FeaturedImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop"
      },
      {
        Id: "19",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Photo Caption",
        Title: "President Visits Disaster-Stricken Areas",
        Author: "Peoples Balita Photo Desk",
        Status: "Published",
        Content: "President delivers relief goods to families affected by recent flooding in Northern Luzon. The visit aimed to assess damage and coordinate relief operations.",
        FeaturedImage: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=600&fit=crop"
      },
      {
        Id: "20",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Photo Caption",
        Title: "Graduation Ceremony at UP Diliman",
        Author: "Peoples Balita Photo Desk",
        Status: "Published",
        Content: "Thousands of graduates celebrate their achievements during the University of the Philippines Diliman commencement exercises.",
        FeaturedImage: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop"
      },
      {
        Id: "21",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Photo Caption",
        Title: "Manila Bay Sunset Rehabilitation",
        Author: "Peoples Balita Photo Desk",
        Status: "Published",
        Content: "Residents and tourists enjoy the stunning sunset at the rehabilitated Manila Bay promenade. The area has become a popular spot for families and photography enthusiasts.",
        FeaturedImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
      }
    ];

    // Uncomment this to use real WordPress data instead of dummy data
    // const allData: News[] = await getAllData({ Date: new Date(), Category: '', Title: '' });

    // Find article by ID
    const article = dummyData.find(a => a.Id === articleId);

    // Get related articles from same category
    const relatedArticles = article
      ? dummyData.filter(a => a.Category === article.Category && a.Id !== articleId).slice(0, 3)
      : [];

    return {
      article: article || null,
      relatedArticles: relatedArticles,
    };
  } catch (error) {
    console.error('Error in clientLoader:', error);
    return {
      article: null,
      relatedArticles: [],
    };
  }
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { article, relatedArticles } = loaderData || { article: null, relatedArticles: [] };
  const dateNowString = dayjs(new Date()).format("MMMM D, YYYY");

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link
            to="/tabloid"
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get all unique categories for navigation
  const allCategories = ['Headlines', 'Subheadlines', 'Sports', 'Showbiz', 'Contributors', 'Editorial', 'Photo Caption'];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-red-600 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-4">
            <Link to="/tabloid">
              <h1 className="text-5xl font-black text-gray-900 mb-2 hover:text-red-600 transition-colors cursor-pointer">
                PEOPLES BALITA
              </h1>
            </Link>
            <p className="text-sm text-gray-600 uppercase tracking-wide">{dateNowString}</p>
          </div>

          {/* Category Navigation Menu */}
          <nav className="border-t border-gray-300 pt-4">
            <div className="flex items-center justify-between mb-2">
              <ul className="flex flex-wrap justify-center gap-2 flex-1">
                <li>
                  <Link
                    to="/tabloid"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-red-600 hover:text-white transition-colors rounded uppercase"
                  >
                    Home
                  </Link>
                </li>
                {allCategories.map(category => (
                  <li key={category}>
                    <Link
                      to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`px-4 py-2 text-sm font-semibold transition-colors rounded uppercase ${
                        category === article.Category
                          ? 'bg-red-600 text-white'
                          : 'text-gray-700 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors border border-blue-600 rounded uppercase"
              >
                Admin Login
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <article className="lg:col-span-2">
            {/* Breadcrumb */}
            <div className="mb-6 text-sm text-gray-600">
              <Link to="/tabloid" className="hover:text-red-600">Home</Link>
              {' '}/{' '}
              <Link to={`/category/${article.Category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-red-600">
                {article.Category}
              </Link>
              {' '}/{' '}
              <span className="text-gray-900">{article.Title}</span>
            </div>

            {/* Category Badge */}
            <div className="mb-4">
              <Link
                to={`/category/${article.Category.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-block px-4 py-1 bg-red-600 text-white text-sm font-bold uppercase rounded hover:bg-red-700 transition-colors"
              >
                {article.Category}
              </Link>
            </div>

            {/* Article Title */}
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              {article.Title}
            </h1>

            {/* Article Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <span className="font-semibold">By {article.Author}</span>
              <span>•</span>
              <time>{article.Date}</time>
            </div>

            {/* Featured Image */}
            {article.FeaturedImage && (
              <div className="mb-8">
                <img
                  src={article.FeaturedImage}
                  alt={article.Title}
                  className="w-full h-[400px] object-cover rounded-lg"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                {article.Content}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share this article</h3>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  Facebook
                </button>
                <button className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors">
                  Twitter
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  WhatsApp
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedArticles.map(related => (
                      <Link
                        key={related.Id}
                        to={`/article/${related.Id}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {related.FeaturedImage ? (
                            <img
                              src={related.FeaturedImage}
                              alt={related.Title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-2xl">📰</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                              {related.Title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">{related.Date}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to Category */}
              <Link
                to={`/category/${article.Category.toLowerCase().replace(/\s+/g, '-')}`}
                className="block w-full px-4 py-3 bg-red-600 text-white text-center font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                More from {article.Category}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-gray-300 bg-gray-100 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Peoples Balita. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
