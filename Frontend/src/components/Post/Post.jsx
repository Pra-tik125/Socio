import { useEffect, useState } from "react";
import fetchData from "../../utils/fetch_data";
import url from "../../utils/url";
import getData from "../../utils/getData";
import Nav from "../Navbar/Nav";
import { useNavigate } from "react-router-dom";
import getCookie from "../../utils/getCookie";
import generate_UID from "../../utils/uid_generator";
import PostImgUpload from "./PostImage";
import { toast } from 'react-toastify'; // Consider adding toast notifications
import 'react-toastify/dist/ReactToastify.css';

const Post = () => {
    const [content, setContent] = useState('');
    const [userData, setUserData] = useState(null);
    const [upid, setUpid] = useState('');
    const [uploadedImgUrl, setUploadedImgUrl] = useState('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const newUpid = generate_UID();
        setUpid(newUpid);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = await getData();
                setUserData(user);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                toast.error("Failed to load user data. Please try again.");
            }
        };
        fetchUserData();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!content.trim()) {
            newErrors.content = "Post content is required";
        } else if (content.length > 500) {
            newErrors.content = "Post content cannot exceed 500 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContent = (e) => {
        setContent(e.target.value);
        // Clear error when user starts typing
        if (errors.content) {
            setErrors(prev => ({ ...prev, content: '' }));
        }
    };

    const handleImageUpload = (imageUrl) => {
        setUploadedImgUrl(imageUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (!userData) {
            toast.error("User data is not loaded yet. Please wait...");
            return;
        }

        setIsSubmitting(true);

        try {
            const body = {
                post: {
                    content: content.trim(),
                    likes: 0,
                },
                metaData: {
                    author: userData.username,
                    profilePicture: getCookie('socio-pf'),
                    date: new Date().toISOString(),
                },
                upid: upid,
                postImg: uploadedImgUrl,
                comments: [],
            };

            const resp = await fetchData(url + '/post', body, 'POST');
            console.log(resp)
            if (resp && resp.
                message) {
                toast.success("Post created successfully!");
                navigate('/feed');
            } else {
                throw new Error(resp?.message || "Failed to create post");
            }
        } catch (error) {
            console.error("Post submission error:", error);
            toast.error(error.message || "Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Nav />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
                <div className="max-w-2xl mx-auto p-4 md:p-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
                            Create a <span className="text-blue-500 dark:text-blue-400">Post</span>
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    What's on your mind?
                                </label>
                                <textarea
                                    id="content"
                                    rows={4}
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.content ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Share your thoughts..."
                                    value={content}
                                    onChange={handleContent}
                                />
                                {errors.content && (
                                    <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                                )}
                                <div className="flex justify-between mt-1">
                                    <span className={`text-xs ${content.length > 500 ? 'text-red-500' : 'text-gray-500'
                                        }`}>
                                        {content.length}/500
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Add an image (optional)
                                </label>
                                <PostImgUpload postId={upid} onUploadSuccess={handleImageUpload} />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 rounded-md font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center ">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Posting...
                                        </div>
                                    ) : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Post;