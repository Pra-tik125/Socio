import { useEffect, useState } from "react";
import fetchData from "../../utils/fetch_data";
import url from "../../utils/url";
import Nav from "../Navbar/Nav";
import { Link, useNavigate } from "react-router-dom";
import { BrokenBoneIcon } from "hugeicons-react";
import toast, { Toaster } from 'react-hot-toast';
import getPerson from "../../utils/getPerson";
import getCookie from "../../utils/getCookie";
import "./people.css";
import { People_skel } from "../Loader/Profile_Skel";

const People = () => {
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch people data
        const peopleResp = await fetchData(`${url}/people`, null, 'GET');
        if (!peopleResp || !Array.isArray(peopleResp)) {
          throw new Error("Invalid data received from server");
        }
        setData(peopleResp);

        // Fetch user data
        const userDoc = await getPerson(getCookie('socio-user'));
        if (!userDoc) {
          throw new Error("Failed to load user profile");
        }
        setUserData(userDoc);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const renderPeopleList = () => {
    if (loading) {
      return (
        <>
          <People_skel />
          <People_skel />
          <People_skel />
          <People_skel />
        </>
      );
    }

    if (error) {
      return (
        <div className="error-container flex flex-col items-center justify-center p-8 rounded-lg bg-red-50 dark:bg-gray-700 text-center">
          <BrokenBoneIcon size={64} className="text-red-400 dark:text-red-300 mb-4" />
          <h3 className="text-lg font-medium text-red-600 dark:text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="empty-state flex flex-col items-center justify-center p-8 rounded-lg bg-gray-50 dark:bg-gray-700 text-center">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            No people found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            It seems there's no one to connect with right now.
          </p>
        </div>
      );
    }

    return data.map((person, index) => (
      <PersonCard
        key={index}
        person={person}
        userData={userData}
      />
    ));
  };

  return (
    <div className="people-page min-h-screen dark:bg-gray-800 dark:text-white">
      <Nav />
      <Toaster position="top-right" />

      <main className="container mx-auto px-4 pt-20 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white">
            Connect with People
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and connect with like-minded individuals in your community
          </p>
        </header>

        <div className="people-list-container bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-none p-4 md:p-6">
          {renderPeopleList()}
        </div>
      </main>
    </div>
  );
};

const PersonCard = ({ person, userData }) => {
  const isSimilar = person.category_pref?.[0] === userData.category_pref?.[0];
  const isCurrentUser = person.username === userData.username;

  return (
    <div className="person-card bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4 transition-all hover:shadow-md">
      <Link
        to={`/profile/${person.username}/${person.uid}`}
        className="block p-4 md:p-6"
      >
        {isSimilar && (
          <div className="similar-tag mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              {isCurrentUser ? "It's You!" : "Just Like You!"}
            </span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="flex-shrink-0">
            <img
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white dark:border-gray-700"
              src={person.profilePicture
                ? `https://lh3.googleusercontent.com/d/${person.profilePicture}`
                : "/d-prof.jpg"
              }
              alt={person.username}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/d-prof.jpg";
              }}
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {person.username}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {person.bio || "No bio available"}
            </p>

            <div className="flex justify-center md:justify-start gap-4 mt-3 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium mr-1">{person.followers?.length || 0}</span>
                Followers
              </div>
              <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <span className="font-medium mr-1">{person.following?.length || 0}</span>
                Following
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default People;