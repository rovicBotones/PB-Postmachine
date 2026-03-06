import { getAllData } from "utils/posts.service";
import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tabloid";
import dayjs from "dayjs";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tabloid - Peoples Balita" }];
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
  request,
}: Route.ClientLoaderArgs) {
  try {
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
      // Classified Ads
      {
        Id: "13",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "House and Lot for Sale - Quezon City",
        Author: "Private Seller",
        Status: "Published",
        Content: "3BR/2BA house and lot, 120sqm floor area, 200sqm lot. Near schools and shopping centers. Contact: 0917-123-4567",
        FeaturedImage: ""
      },
      {
        Id: "14",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "Hiring: Sales Representatives",
        Author: "ABC Corporation",
        Status: "Published",
        Content: "Looking for motivated sales representatives. College graduate preferred. Salary: 20k-30k + commission. Email: careers@abccorp.ph",
        FeaturedImage: ""
      },
      {
        Id: "15",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "Toyota Vios 2020 for Sale",
        Author: "Private Seller",
        Status: "Published",
        Content: "Well-maintained, low mileage, complete papers. Price: ₱550,000 negotiable. Contact: 0926-987-6543",
        FeaturedImage: ""
      },
      {
        Id: "16",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "Room for Rent - Manila",
        Author: "Property Owner",
        Status: "Published",
        Content: "Spacious room with private bathroom, fully furnished, with WiFi. ₱8,000/month. Near LRT station. Contact: 0915-555-1234",
        FeaturedImage: ""
      },
      {
        Id: "17",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "Computer Repair Services",
        Author: "Tech Solutions",
        Status: "Published",
        Content: "Professional computer repair and maintenance. Home service available. Affordable rates. Call: 0917-888-9999",
        FeaturedImage: ""
      },
      {
        Id: "18",
        Date: new Date().toLocaleDateString('en-US'),
        Category: "Classified Ads",
        Title: "English Tutor Available",
        Author: "Certified Teacher",
        Status: "Published",
        Content: "Experienced English tutor for kids and adults. Online or face-to-face sessions. ₱500/hour. Contact: 0928-111-2222",
        FeaturedImage: ""
      },
      // Photo Captions
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

    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const dateToday = new Date();
    const dateFilter = date ? new Date(date) : dateToday;

    const filter = {
      Date: dateFilter,
      Category: "",
      Title: "",
    };

    // Uncomment this to use real WordPress data instead of dummy data
    // const datas: News[] = await getAllData(filter);

    return {
      datas: dummyData,
      filter: filter,
    };
  } catch (error) {
    console.error('Error in clientLoader:', error);
    return {
      datas: [],
      filter: { Date: new Date(), Category: '', Title: '' },
    };
  }
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Tabloid({ loaderData }: Route.ComponentProps) {
  const posts = loaderData || { datas: [], filter: {} };
  const dateNowString = dayjs(posts.filter?.Date || new Date()).format("MMMM D, YYYY");
  const [searchDate, setSearchDate] = React.useState("");
  const [filteredClassifiedAds, setFilteredClassifiedAds] = React.useState<News[]>([]);

  // Group posts by category
  const groupedPosts = React.useMemo(() => {
    const groups: { [key: string]: News[] } = {};
    (posts.datas || []).forEach(post => {
      if (!groups[post.Category]) {
        groups[post.Category] = [];
      }
      groups[post.Category].push(post);
    });
    return groups;
  }, [posts.datas]);

  // Filter classified ads by date
  React.useEffect(() => {
    const classifiedAds = groupedPosts['Classified Ads'] || [];
    if (searchDate) {
      const filtered = classifiedAds.filter(ad => {
        const adDate = new Date(ad.Date).toISOString().split('T')[0];
        return adDate === searchDate;
      });
      setFilteredClassifiedAds(filtered);
    } else {
      setFilteredClassifiedAds(classifiedAds);
    }
  }, [searchDate, groupedPosts]);

  // Article Card Component
  const ArticleCard = ({ post, featured = false }: { post: News; featured?: boolean }) => {
    const excerpt = post.Content.substring(0, 120) + '...';

    return (
      <Link to={`/article/${post.Id}`} className={`group cursor-pointer block ${featured ? 'md:col-span-2' : ''}`}>
        <article>
          <div className="relative overflow-hidden rounded-lg bg-gray-100">
            {post.FeaturedImage ? (
              <img
                src={post.FeaturedImage}
                alt={post.Title}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  featured ? 'h-[400px]' : 'h-[200px]'
                }`}
              />
            ) : (
              <div className={`w-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${
                featured ? 'h-[400px]' : 'h-[200px]'
              }`}>
                <span className="text-gray-400 text-4xl">📰</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded">
                {post.Category}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors ${
              featured ? 'text-2xl mb-2' : 'text-lg'
            }`}>
              {post.Title}
            </h3>
            {featured && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-3">{excerpt}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{post.Author}</span>
              <span>•</span>
              <span>{post.Date}</span>
              {post.Status === 'Draft' && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-semibold">DRAFT</span>
                </>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  };

  // Get categories excluding Classified Ads
  const categories = React.useMemo(() => {
    return Object.keys(groupedPosts).filter(cat => cat !== 'Classified Ads');
  }, [groupedPosts]);

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
                {categories.map(category => (
                  <li key={category}>
                    <Link
                      to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-red-600 hover:text-white transition-colors rounded uppercase"
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
        {/* Headlines Section */}
        {groupedPosts['Headlines'] && groupedPosts['Headlines'].length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 pb-2 border-b-4 border-red-600 inline-block">
              HEADLINES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {groupedPosts['Headlines'][0] && (
                <ArticleCard post={groupedPosts['Headlines'][0]} featured={true} />
              )}
              <div className="grid grid-cols-1 gap-6">
                {groupedPosts['Headlines'].slice(1, 3).map(post => (
                  <ArticleCard key={post.Id} post={post} />
                ))}
              </div>
            </div>
            {groupedPosts['Headlines'].length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                {groupedPosts['Headlines'].slice(3).map(post => (
                  <ArticleCard key={post.Id} post={post} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Latest News Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Other Categories */}
            {Object.entries(groupedPosts).map(([category, categoryPosts]) => {
              if (category === 'Headlines' || category === 'Classified Ads' || categoryPosts.length === 0) return null;

              return (
                <section key={category}>
                  <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-blue-600 inline-block uppercase">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {categoryPosts.map(post => (
                      <ArticleCard key={post.Id} post={post} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Classified Ads Table Section */}
            {groupedPosts['Classified Ads'] && groupedPosts['Classified Ads'].length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-blue-600 inline-block uppercase">
                  Classified Ads
                </h2>

                {/* Date Search */}
                <div className="mb-4 mt-6">
                  <label htmlFor="classifiedDateSearch" className="block text-sm font-medium text-gray-700 mb-2">
                    Search by Date:
                  </label>
                  <input
                    type="date"
                    id="classifiedDateSearch"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchDate && (
                    <button
                      onClick={() => setSearchDate("")}
                      className="ml-3 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                {/* Classified Ads Table */}
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posted By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClassifiedAds.length > 0 ? (
                        filteredClassifiedAds.map(ad => (
                          <tr key={ad.Id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ad.Title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-md">{ad.Content}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{ad.Author}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{ad.Date}</div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No classified ads found for the selected date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Stats Card */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-bold text-lg mb-4">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Articles:</span>
                    <span className="font-bold">{posts.datas?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published:</span>
                    <span className="font-bold text-green-600">
                      {posts.datas?.filter(p => p.Status === 'Published').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drafts:</span>
                    <span className="font-bold text-orange-600">
                      {posts.datas?.filter(p => p.Status === 'Draft').length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Categories</h3>
                <div className="space-y-2">
                  {Object.entries(groupedPosts).map(([category, categoryPosts]) => (
                    <div key={category} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-700">{category}</span>
                      <span className="bg-gray-200 px-2 py-1 rounded text-xs font-semibold">
                        {categoryPosts.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
