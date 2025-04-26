import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import toast, { Toaster } from 'react-hot-toast';
import TimeAgo from 'react-timeago';
import feather from 'feather-icons';

// Utils
import fetchData from "../../utils/fetch_data";
import url from "../../utils/url";
import getCookie from "../../utils/getCookie";
import getUserData from "../../utils/getData";

// Components
import Nav from "../Navbar/Nav";
import DelPost from "../Post_actions/DelPost";
import LikePost from "../Post_actions/LikePost";
import DelPerm from "../Post_actions/DelePerm";
import AddFollower from "../Post_actions/addFollower";
import FileUpload from "./FileUpload.jsx";
import { Bio_skel, Cat_skel, Pff_skel, Username_skell } from "../Loader/Profile_Skel.jsx";

// Icons
import { BiHeart, BiSolidHeart, BiSolidLeftArrow, BiSolidRightArrow } from "react-icons/bi";
import { FaCommentSlash, FaDotCircle, FaRegComment } from "react-icons/fa";
import { FaRegTrashCan, FaTrashCan } from 'react-icons/fa6';
import { MdCancel } from 'react-icons/md';

import { GrClose, GrLike, GrTag } from "react-icons/gr";
import { CommentAdd01Icon, CommentRemove01Icon, Logout05Icon, UserAdd01Icon, UserCheck01Icon, UserEdit01Icon } from "hugeicons-react";

const ProfilePage = () => {
    // State management
    const { username, uidTo } = useParams();
    const navigate = useNavigate();
    const [cookies, , removeCookie] = useCookies(['sociotoken', 'socio-pf', 'socio-user']);

    const [updateMode, setUpdateMode] = useState(false);
    const [formData, setFormData] = useState({ bio: "" });
    const [profileData, setProfileData] = useState({});
    const [userData, setUserData] = useState({});
    const [myPosts, setMyPosts] = useState([]);
    const [myTrash, setMyTrash] = useState([]);
    const [openMyPosts, setOpenMyPosts] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [openFollowers, setOpenFollowers] = useState(false);
    const [openFollowing, setOpenFollowing] = useState(false);
    const [pisLoading, setPIsLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [openCLikeStates, setOpenCLikeStates] = useState({});
    const [openPostLikeStates, setOpenPostLikeStates] = useState({});
    const [showComments, setShowComments] = useState({});

    // Refs
    const dropdownRef = useRef(null);

    // Handlers
    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    }, []);

    const logout = useCallback(() => {
        removeCookie('sociotoken');
        removeCookie('socio-pf');
        navigate("/");
    }, [navigate, removeCookie]);

    const handleCommentChange = useCallback((e) => {
        setComment(e.target.value);
    }, []);

    const handleDel = useCallback(async (postId) => {
        try {
            await DelPost(postId);
            await getMyData();
        } catch (error) {
            toast.error("Failed to delete post");
            console.error("Delete post error:", error);
        }
    }, []);

    const handleDelPermenently = useCallback(async (postId) => {
        try {
            await DelPerm(postId);
            await getMyData();
        } catch (error) {
            toast.error("Failed to permanently delete post");
            console.error("Permanent delete error:", error);
        }
    }, []);

    const handleLike = useCallback(async (postId) => {
        try {
            await LikePost(postId);
            await getMyData();
        } catch (error) {
            toast.error("Failed to like post");
            console.error("Like post error:", error);
        }
    }, []);

    const toggleOpenCLike = useCallback((commentId) => {
        setOpenCLikeStates(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    }, []);

    const toggleOpenPostLike = useCallback((postId) => {
        setOpenPostLikeStates(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    }, []);

    const toggleComments = useCallback((postId) => {
        setShowComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    }, []);

    // Data fetching
    const getData = useCallback(async () => {
        setPIsLoading(true);
        try {
            const data = await fetchData(`${url}/feed`, null, 'GET');
            setFeedPosts(data);
            await getMyData();
        } catch (error) {

            console.error("Feed data error:", error);
        } finally {
            setPIsLoading(false);
        }
    }, []);

    const getMyData = useCallback(async () => {
        try {
            const [resp, resp1] = await Promise.all([
                fetchData(`${url}/person`, { username }, 'POST'),
                fetchData(`${url}/myPosts`, { username }, 'POST')
            ]);

            setProfileData(resp);

            // Check if current user is following this profile
            const isFollowing = resp.followers?.some(user => user.username === cookies['socio-user']);
            setIsFollowing(isFollowing);

            // Get trash only if it's the user's own profile
            let resp2 = [];
            if (username === cookies['socio-user']) {
                resp2 = await fetchData(`${url}/myTrash`, null, 'GET');
            }

            setMyPosts(resp1);
            setMyTrash(resp2);
        } catch (error) {
            toast.error("Failed to load profile data");
            console.error("Profile data error:", error);
        }
    }, [username, cookies]);

    const handleProfileUpdate = useCallback(async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const fields = Object.fromEntries(formData.entries());
        fields.username = username;

        toast.loading("Updating profile data");
        try {
            const resp = await fetchData(`${url}/profile`, fields, 'PUT');

            if (resp.status === 200) {
                setUpdateMode(false);
                toast.success(resp.message);
                await getMyData();
            } else {
                toast.error(resp.message);
            }
        } catch (error) {
            toast.error("Failed to update profile");
            console.error("Profile update error:", error);
        } finally {
            toast.dismiss();
        }
    }, [username, getMyData]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddComment = useCallback(async (e, post) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            await fetchData(`${url}/comment`, {
                comment: comment.trim(),
                id: post._id,
                post: post
            }, "PUT");
            await getData();
            setComment('');
        } catch (error) {
            toast.error("Failed to add comment");
            console.error("Add comment error:", error);
        }
    }, [comment, getData]);

    const handleCLike = useCallback(async (e, postId, commentId) => {
        e.preventDefault();
        try {
            await fetchData(`${url}/comment`, { post_id: postId, comment_id: commentId }, "POST");
            await getData();
        } catch (error) {
            toast.error("Failed to like comment");
            console.error("Like comment error:", error);
        }
    }, [getData]);

    const handleCommentDel = useCallback(async (e, postId, commentId) => {
        e.preventDefault();
        try {
            await fetchData(`${url}/comment`, { post_id: postId, comment_id: commentId }, "DELETE");
            await getData();
        } catch (error) {
            toast.error("Failed to delete comment");
            console.error("Delete comment error:", error);
        }
    }, [getData]);

    const handleFollow = useCallback(async () => {
        try {
            const response = await AddFollower(profileData.uid);
            setIsFollowing(response.status === 201);
        } catch (error) {
            toast.error("Failed to update follow status");
            console.error("Follow error:", error);
        }
    }, [profileData.uid]);

    // Effects
    useEffect(() => {
        feather.replace();
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    useEffect(() => {
        const fetchInitialData = async () => {
            await getData();
            const user = await getUserData();
            setUserData(user);
        };
        fetchInitialData();
    }, [getData]);

    useEffect(() => {
        getMyData();
    }, [username, getMyData]);

    // Component rendering
    const renderPost = (post, isTrash = false) => {
        const isLiked = post.post.likedBy?.some(like => like.username === userData.username) || false;
        const openPostLike = openPostLikeStates[post._id] || false;
        const showPostComments = showComments[post._id] || false;

        return (
            <div key={post._id} className="post bg-gray-100 dark:bg-gray-900 mb-4 rounded-lg px-4 py-2 drop-shadow-lg w-full max-w-md">
                <div className="top-bar author flex flex-row justify-between items-center">
                    <div className="left flex flex-row items-center w-full">
                        <Link to={`/profile/${post.metaData.author}/👋`} className="flex flex-row items-center justify-start w-full">
                            <img
                                className="rounded-full w-8 h-8 border-3 border-white border-solid mr-2 object-cover"
                                src={post.metaData.profilePicture ? `https://lh3.googleusercontent.com/d/${post.metaData.profilePicture}` : "/d-prof.jpg"}
                                alt="Profile"
                            />
                            <b>{post.metaData.author}</b>
                        </Link>
                    </div>
                    {post.metaData.author === userData.username && (
                        <button
                            onClick={() => isTrash ? handleDelPermenently(post._id) : handleDel(post._id)}
                            className="transition-all duration-300 border border-red-800 border-solid text-red-800 rounded-full px-2 py-2 text-xs hover:bg-red-900 hover:text-white"
                            aria-label={isTrash ? "Permanently delete" : "Move to trash"}
                        >
                            <FaTrashCan />
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-600">
                    <TimeAgo date={post.metaData.date} />
                </p>
                <div className="middle-section flex flex-col w-full break-words px-0 py-4 whitespace-pre-wrap overflow-wrap-anywhere">
                    <div>{post.post.content}</div>
                    {post.postImg && post.postImg !== "none" && (
                        <img
                            className="rounded-2xl w-full h-full object-cover mt-1"
                            src={`https://lh3.googleusercontent.com/d/${post.postImg}`}
                            alt="Post content"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/image-error-placeholder.png";
                            }}
                        />
                    )}
                </div>
                <div className="bottom-bar mb-2 flex flex-row justify-between">
                    {post.category && (
                        <div className="flex flex-row text-xs items-center rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-0">
                            <GrTag className="mr-1" /> <b>{post.category}</b>
                        </div>
                    )}
                    <div className="flex flex-row items-center space-x-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => handleLike(post._id)}
                                className="flex items-center"
                                aria-label={isLiked ? "Unlike post" : "Like post"}
                            >
                                {isLiked ? <BiSolidHeart color="red" /> : <BiHeart />}
                            </button>
                            <button
                                className="px-2"
                                onClick={() => toggleOpenPostLike(post._id)}
                                aria-label="View likes"
                            >
                                <b>{post.post.likes || 0}</b>
                            </button>
                        </div>
                        <button
                            className="flex items-center transition-all duration-300"
                            onClick={() => toggleComments(post._id)}
                            aria-label={showPostComments ? "Hide comments" : "Show comments"}
                        >
                            {showPostComments ? <FaCommentSlash size={14} /> : <FaRegComment size={14} />}
                            <span className="px-2">{post.post.comments.length || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Likes popup */}
                {openPostLike && (
                    <div className="absolute z-10 w-40 right-0 mt-2 bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-lg">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Post Liked by</span>
                            <button
                                onClick={() => toggleOpenPostLike(post._id)}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Close likes popup"
                            >
                                <GrClose />
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                            {post.post.likedBy?.length > 0 ? (
                                post.post.likedBy.map((user, i) => (
                                    <Link
                                        key={i}
                                        to={`/profile/${user.username}/${user.uid}`}
                                        className="block rounded-lg mb-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <div className="flex items-center">
                                            <img
                                                className="rounded-full w-6 h-6 mr-2 object-cover"
                                                src={user.profilePicture ? `https://lh3.googleusercontent.com/d/${user.profilePicture}` : "/d-prof.jpg"}
                                                alt="Profile"
                                            />
                                            @{user.username}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="px-3 py-2 text-gray-500">No likes yet</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments section */}
                {showPostComments && (
                    <div className="mt-4">
                        <div className="space-y-4">
                            {post.post.comments?.length > 0 ? (
                                post.post.comments.map((comment) => {
                                    const openCLike = openCLikeStates[comment.comment_id] || false;
                                    const cisLiked = comment.likedBy?.some(like => like.username === userData.username) || false;

                                    return (
                                        <div key={comment.comment_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Link
                                                        to={`/profile/${comment.commentBy}/👋`}
                                                        className="flex items-center"
                                                    >
                                                        <img
                                                            className="rounded-full w-6 h-6 mr-2 object-cover"
                                                            src={comment.profilePicC ? `https://lh3.googleusercontent.com/d/${comment.profilePicC}` : "/d-prof.jpg"}
                                                            alt="Profile"
                                                        />
                                                        <b>{comment.commentBy || "Unknown"}</b>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        <TimeAgo date={comment.date} />
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => handleCLike(e, post._id, comment.comment_id)}
                                                        className="flex items-center"
                                                        aria-label={cisLiked ? "Unlike comment" : "Like comment"}
                                                    >
                                                        {cisLiked ? <BiSolidHeart color="red" size={14} /> : <BiHeart size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleOpenCLike(comment.comment_id)}
                                                        className="text-sm"
                                                        aria-label="View comment likes"
                                                    >
                                                        <b>{comment.likedBy?.length || 0}</b>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 whitespace-pre-wrap overflow-wrap-anywhere">
                                                {comment.comment}
                                            </div>
                                            {comment.commentBy === userData.username && (
                                                <button
                                                    onClick={(e) => handleCommentDel(e, post._id, comment.comment_id)}
                                                    className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                                                    aria-label="Delete comment"
                                                >
                                                    <CommentRemove01Icon size={14} className="mr-1" />
                                                    Delete
                                                </button>
                                            )}

                                            {/* Comment likes popup */}
                                            {openCLike && (
                                                <div className="absolute z-10 w-40 mt-2 bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-lg">
                                                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Liked by</span>
                                                        <button
                                                            onClick={() => toggleOpenCLike(comment.comment_id)}
                                                            className="text-gray-500 hover:text-gray-700"
                                                            aria-label="Close likes popup"
                                                        >
                                                            <GrClose />
                                                        </button>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto p-2">
                                                        {comment.likedBy?.length > 0 ? (
                                                            comment.likedBy.map((user, i) => (
                                                                <Link
                                                                    key={i}
                                                                    to={`/profile/${user.username}/${user.uid}`}
                                                                    className="block rounded-lg mb-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    @{user.username}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <p className="px-3 py-2 text-gray-500">No likes yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500">No comments yet</p>
                            )}
                        </div>
                        <form onSubmit={(e) => handleAddComment(e, post)} className="mt-4 flex items-center">
                            <input
                                type="text"
                                value={comment}
                                onChange={handleCommentChange}
                                placeholder="Add a comment..."
                                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Comment input"
                            />
                            <button
                                type="submit"
                                className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Submit comment"
                            >
                                <CommentAdd01Icon size={18} />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    };

    const renderEmptyState = (icon, message) => (
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-900 text-gray-400 w-72 h-72 flex flex-col justify-center items-center">
            {icon}
            <p className="mt-4">{message}</p>
        </div>
    );

    return (
        <>
            <Nav />
            <Toaster position="top-right" />

            {updateMode ? (
                <div className="container pt-20 mx-auto px-4 py-8">
                    <form onSubmit={handleProfileUpdate} className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit Profile</h2>
                            <button
                                type="button"
                                onClick={() => setUpdateMode(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                aria-label="Cancel edit"
                            >
                                <GrClose size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-6">
                            <FileUpload
                                username={cookies['socio-user']}
                                src={profileData.profilePicture ? `https://lh3.googleusercontent.com/d/${profileData.profilePicture}` : "/d-prof.jpg"}
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={profileData.username || ""}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-md"
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    maxLength={36}
                                    placeholder="Tell something about yourself"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-md resize-none h-24"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="container pt-20 mx-auto px-4 py-8">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex flex-col items-center w-full max-w-4xl">
                            <div className="flex flex-col md:flex-row items-center w-full mb-6">
                                <img
                                    className="rounded-full w-24 h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 border-4 border-white dark:border-gray-800 object-cover shadow-md mb-4 md:mb-0 md:mr-8"
                                    src={profileData.profilePicture ? `https://lh3.googleusercontent.com/d/${profileData.profilePicture}` : "/d-prof.jpg"}
                                    alt="Profile"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/d-prof.jpg";
                                    }}
                                />

                                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                    <h1 className="text-2xl md:text-4xl font-bold mb-2">
                                        {profileData.username || <Username_skell />}
                                    </h1>

                                    <div className="flex flex-col md:flex-row items-center mb-4">
                                        <p className="whitespace-pre-wrap overflow-wrap-anywhere max-w-md mb-2 md:mb-0 md:mr-4">
                                            {profileData.bio || <Bio_skel />}
                                        </p>

                                        {profileData.category_pref && (
                                            <div className="flex items-center text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                                                <BiSolidHeart size={16} className="mr-1" />
                                                {profileData.category_pref[0] || <Cat_skel />}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-6 mb-4">
                                        <button className="flex flex-col items-center">
                                            <span className="text-xl font-bold">{myPosts?.length || 0}</span>
                                            <span className="text-sm">Posts</span>
                                        </button>

                                        <button
                                            className="flex flex-col items-center relative"
                                            onClick={() => {
                                                setOpenFollowers(!openFollowers);
                                                setOpenFollowing(false);
                                            }}
                                        >
                                            <span className="text-xl font-bold">{profileData.followers?.length || 0}</span>
                                            <span className="text-sm">Followers</span>

                                            {openFollowers && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="text-sm font-medium">Followers</h3>
                                                        <button onClick={() => setOpenFollowers(false)}>
                                                            <GrClose size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {profileData.followers?.length > 0 ? (
                                                            profileData.followers.map((user, i) => (
                                                                <Link
                                                                    key={i}
                                                                    to={`/profile/${user.username}/${user.uid}`}
                                                                    className="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2"
                                                                >
                                                                    <img
                                                                        className="rounded-full w-8 h-8 mr-2 object-cover"
                                                                        src={user.profilePicture ? `https://lh3.googleusercontent.com/d/${user.profilePicture}` : "/d-prof.jpg"}
                                                                        alt="Profile"
                                                                    />
                                                                    {user.username}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-500 py-2">No followers yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            className="flex flex-col items-center relative"
                                            onClick={() => {
                                                setOpenFollowing(!openFollowing);
                                                setOpenFollowers(false);
                                            }}
                                        >
                                            <span className="text-xl font-bold">{profileData.following?.length || 0}</span>
                                            <span className="text-sm">Following</span>

                                            {openFollowing && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="text-sm font-medium">Following</h3>
                                                        <button onClick={() => setOpenFollowing(false)}>
                                                            <GrClose size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {profileData.following?.length > 0 ? (
                                                            profileData.following.map((user, i) => (
                                                                <Link
                                                                    key={i}
                                                                    to={`/profile/${user.username}/${user.uid}`}
                                                                    className="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2"
                                                                >
                                                                    <img
                                                                        className="rounded-full w-8 h-8 mr-2 object-cover"
                                                                        src={user.profilePicture ? `https://lh3.googleusercontent.com/d/${user.profilePicture}` : "/d-prof.jpg"}
                                                                        alt="Profile"
                                                                    />
                                                                    {user.username}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-500 py-2">Not following anyone</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>

                                    {username !== cookies['socio-user'] && (
                                        <button
                                            onClick={handleFollow}
                                            className={`px-4 py-2 rounded-lg transition-colors ${isFollowing ? "bg-blue-200 dark:bg-blue-900 text-black dark:text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                        >
                                            {isFollowing ? (
                                                <span className="flex items-center">
                                                    Following <UserCheck01Icon size={18} className="ml-1" />
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    Follow <UserAdd01Icon size={18} className="ml-1" />
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {username === cookies['socio-user'] && (
                                        <div className="flex space-x-4 mt-4">
                                            <button
                                                onClick={() => setUpdateMode(true)}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                                            >
                                                <UserEdit01Icon size={18} className="mr-1" />
                                                Edit Profile
                                            </button>

                                            <button
                                                onClick={logout}
                                                className="px-4 py-2 text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors flex items-center"
                                            >
                                                <Logout05Icon size={18} className="mr-1" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Posts/Trash Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                                className={`px-6 py-2 ${openMyPosts ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                                onClick={() => setOpenMyPosts(true)}
                            >
                                Posts by {username === cookies['socio-user'] ? "You" : username}
                            </button>

                            {username === cookies['socio-user'] && (
                                <button
                                    className={`px-6 py-2 ${!openMyPosts ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                                    onClick={() => setOpenMyPosts(false)}
                                >
                                    My Trash
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Posts/Trash Content */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl space-y-6">
                            {openMyPosts ? (
                                myPosts?.length > 0 ? (
                                    myPosts.map(post => renderPost(post))
                                ) : (
                                    renderEmptyState(
                                        <MdCancel size={80} color="lightgray" />,
                                        "No Posts Yet"
                                    )
                                )
                            ) : username === cookies['socio-user'] ? (
                                myTrash?.length > 0 ? (
                                    myTrash.map(post => renderPost(post, true))
                                ) : (
                                    renderEmptyState(
                                        <FaRegTrashCan size={80} color="lightgray" />,
                                        "No Trash Yet"
                                    )
                                )
                            ) : (
                                renderEmptyState(
                                    <BiShieldX size={80} color="lightgray" />,
                                    "Private"
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePage;