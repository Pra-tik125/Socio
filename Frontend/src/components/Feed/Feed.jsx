import React, { useEffect, useState, useCallback, useRef } from "react";
import fetchData from "../../utils/fetch_data";
import url from '../../utils/url';
import DelPost from "../Post_actions/DelPost";
import getUserData from "../../utils/getData";
import { BiHeart, BiSolidHeart } from "react-icons/bi";
import LikePost from "../Post_actions/LikePost";
import Nav from "../Navbar/Nav";
import './feed.css';
import { Link, useNavigate } from "react-router-dom";
import { FaCommentSlash, FaRegComment, FaTrashCan } from "react-icons/fa6";
import TimeAgo from 'react-timeago';
import { CommentAdd01Icon, CommentRemove01Icon } from "hugeicons-react";
import { GrClose, GrTag } from "react-icons/gr";
import toast, { Toaster } from 'react-hot-toast';
import getCookie from "../../utils/getCookie";
import InfiniteScroll from "react-infinite-scroll-component";
import Loading from "../Loader/Loading";
import { Post_skel } from "../Loader/Profile_Skel";
import { FaPlus,FaRegNewspaper,FaSearch } from 'react-icons/fa';


const Feed = () => {
    // State management
    const [feedPosts, setFeedPosts] = useState([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [userData, setUserData] = useState({});
    const [comment, setComment] = useState('');
    const [openCLikeStates, setOpenCLikeStates] = useState({});
    const [openPostLikeStates, setOpenPostLikeStates] = useState({});
    const [showComments, setShowComments] = useState({});
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        postId: null
    });

    const limit = 15;
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Memoized data fetching
    const getData = useCallback(async (limit, offset) => {
        setFeedLoading(true);
        try {
            const data = await fetchData(`${url}/feed?limit=${limit}&offset=${offset}`, null, 'GET');
            setFeedPosts(data.paginatedFeed);
            console.log("feedData", data)
            setTotal(data.total);
            setHasMore(data.paginatedFeed.length >= limit);
        } catch (error) {
            console.error("Error fetching feed data:", error);
            toast.error("Failed to load feed");
        } finally {
            setFeedLoading(false);
        }
    }, []);

    const fetchUserData = useCallback(async () => {
        try {
            const user = await getUserData();
            setUserData(user);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([getData(limit, offset), fetchUserData()]);
        };
        loadData();
    }, [getData, fetchUserData, limit, offset]);

    // Event handlers
    const handleCommentChange = (e) => setComment(e.target.value);

    const handleDel = async (postId) => {
        setDeleteModal({
            isOpen: true,
            postId: postId
        });
    };

    const confirmDelete = async () => {
        try {
            setFeedPosts(prevPosts => prevPosts.filter(post => post._id !== deleteModal.postId));
            await DelPost(deleteModal.postId);
            setDeleteModal({
                isOpen: false,
                postId: null
            });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        }
    };

    const cancelDelete = () => {
        setDeleteModal({
            isOpen: false,
            postId: null
        });
    };

    const handleLike = useCallback(async (postId, isLiked) => {
        try {
            setFeedPosts(prevPosts =>
                prevPosts.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            post: {
                                ...post.post,
                                likes: isLiked ? post.post.likes - 1 : post.post.likes + 1,
                                likedBy: isLiked
                                    ? post.post.likedBy.filter(like => like.username !== userData.username)
                                    : [...post.post.likedBy, { username: userData.username }],
                            },
                        }
                        : post
                )
            );
            await LikePost(postId);
        } catch (error) {
            console.error("Error liking post:", error);
        }
    }, [userData.username]);

    const toggleOpenCLike = useCallback((commentId) => {
        setOpenCLikeStates(prevStates => ({
            ...prevStates,
            [commentId]: !prevStates[commentId]
        }));
    }, []);

    const toggleOpenPostLike = useCallback((postId) => {
        setOpenPostLikeStates(prevStates => ({
            ...prevStates,
            [postId]: !prevStates[postId]
        }));
    }, []);

    const toggleComments = useCallback((postId) => {
        setShowComments(prevState => ({
            ...prevState,
            [postId]: !prevState[postId],
        }));
    }, []);

    // Component for rendering a single post
    const PostItem = React.memo(({ post, userData, index }) => {
        const isLiked = post.post.likedBy.some(like => like.username === userData.username);
        const openPostLike = openPostLikeStates[post._id] || false;
        const showPostComments = showComments[post._id] || false;

        const handleAddComment = async (e) => {
            e.preventDefault();
            if (!comment.trim()) return;

            try {
                await fetchData(url + '/comment', {
                    comment: comment,
                    id: post._id,
                    post: post,
                    profilePicC: getCookie('socio-pf')
                }, "PUT");
                setFeedPosts([]);
                setOffset(0);
                getData(limit, 0);
                setComment('');
            } catch (error) {
                console.error("Error adding comment:", error);
                toast.error("Failed to add comment");
            }
        };

        return (
            <div key={index} className="post bg-gray-100 dark:bg-gray-900 mb-4 rounded-lg px-4 py-2 drop-shadow-lg"
                style={{ width: window.innerWidth < 766 ? "343px" : "432px" }}>

                {/* Post Header */}
                <div className="top-bar author flex flex-row justify-between items-center">
                    <Link to={`/profile/${post.metaData.author}/👋`} className="left flex flex-row items-center justify-start w-full">
                        <img
                            className="rounded-full w-8 h-8 border-3 border-white border-solid mr-2 object-cover"
                            src={post.metaData.profilePicture ? `https://lh3.googleusercontent.com/d/${post.metaData.profilePicture}` : "/d-prof.jpg"}
                            alt="Profile"
                        />
                        <b>{post.metaData.author}</b>
                    </Link>
                    {post.metaData.author === userData.username && (
                        <button
                            onClick={() => handleDel(post._id)}
                            className="transition-all duration-300 border border-red-800 border-solid text-red-800 rounded-full px-2 py-2 text-xs dark:text-gray-700 hover:bg-red-900 hover:text-white"
                        >
                            <FaTrashCan />
                        </button>
                    )}
                </div>

                {/* Post Metadata */}
                <p className="text-xs text-gray-600">
                    <TimeAgo date={post.metaData.date} />
                </p>

                {/* Post Content */}
                <div className="middle-section flex flex-col w-full break-words px-0 py-4" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    <div>{post.post.content}</div>
                    {post.postImg && post.postImg !== "none" && (
                        <img
                            className="rounded-2xl w-full h-full object-cover mt-1"
                            src={`https://lh3.googleusercontent.com/d/${post.postImg}`}
                            alt="Post content"
                        />
                    )}
                </div>

                {/* Post Footer */}
                <div className="bottom-bar mb-2 flex flex-row justify-between">
                    {post.category && (
                        <div className="flex flex-row text-xs justify-evenly items-center rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-0">
                            <GrTag /> <b>{post.category}</b>
                        </div>
                    )}
                    <div className="flex flex-row justify-evenly items-center">
                        <div className="flex py-2 flex-row items-center justify-center">
                            <button onClick={() => handleLike(post._id, isLiked)} className="likes flex flex-row items-center justify-center">
                                {isLiked ? <BiSolidHeart color="red" /> : <BiHeart />}
                            </button>
                            <button className="px-2" onClick={() => toggleOpenPostLike(post._id)}>
                                <b>{post.post.likes}</b>
                            </button>
                        </div>
                        <button className="flex flex-row items-center justify-center transition-all duration-300" onClick={() => toggleComments(post._id)}>
                            {showPostComments ? <FaCommentSlash size={14} /> : <FaRegComment size={14} />}
                            <p className="px-2">{post.post.comments.length}</p>
                        </button>
                    </div>
                </div>

                {/* Post Likes Modal */}
                {openPostLike && (
                    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                        <p className="text-xs text-gray-400 py-2">Post Liked by</p>
                        <button onClick={() => toggleOpenPostLike(post._id)} className="absolute right-2">
                            <GrClose color="red" />
                        </button>
                        <div className="max-h-[50vh] overflow-y-auto mt-4">
                            {post.post.likedBy.length > 0 ? (
                                post.post.likedBy.map((el, i) => (
                                    <div key={i} className="rounded-lg mb-2 px-4 py-2 bg-gray-200 dark:bg-gray-800">
                                        <Link to={`/profile/${el.username}/${el.uid}`}>
                                            @ {el.username}
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="px-1 py-2">No one :(</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                {showPostComments && (
                    <div className="flex flex-col-reverse px-2 py-3 rounded-xl">
                        {post.post.comments.length > 0 ? (
                            <>
                                {post.post.comments.map((el, i) => {
                                    const openCLike = openCLikeStates[el.comment_id] || false;
                                    const cisLiked = el.likedBy.some(like => like.username === userData.username);

                                    const handleCLike = async (e) => {
                                        e.preventDefault();
                                        await fetchData(url + "/comment", { post_id: post.upid, comment_id: el.comment_id }, "POST");
                                        getData();
                                    };

                                    const handleCommentDel = async (e) => {
                                        e.preventDefault();
                                        await fetchData(url + '/comment', { post_id: post.upid, comment_id: el.comment_id }, "DELETE");
                                        getData();
                                    };

                                    return (
                                        <div key={i} className="flex flex-col mb-4 drop-shadow-lg bg-white dark:bg-gray-800 w-full px-4 py-4 border border-solid border-gray-200 rounded-xl">
                                            <div className="w-full flex flex-row justify-between">
                                                <div className="flex flex-col">
                                                    <Link to={`/profile/${el.commentBy}/👋`} className="flex flex-row items-center">
                                                        <img
                                                            className="rounded-full w-8 h-8 border-3 border-white border-solid mr-2 object-cover"
                                                            src={el.profilePicC ? `https://lh3.googleusercontent.com/d/${el.profilePicC}` : "/d-prof.jpg"}
                                                            alt="Profile"
                                                        />
                                                        <b>{el.commentBy || "aiyen?!"}</b>
                                                    </Link>
                                                    <p className="text-xs text-gray-600">
                                                        <TimeAgo date={el.date} />
                                                    </p>
                                                </div>
                                                <div className="flex flex-col justify-center items-center">
                                                    <div className="flex flex-row justify-center items-center">
                                                        <button className="flex flex-row" onClick={handleCLike}>
                                                            {cisLiked ? <BiSolidHeart color="red" /> : <BiHeart />}
                                                        </button>
                                                        <button onClick={() => toggleOpenCLike(el.comment_id)} className="px-2">
                                                            <b>{el.likedBy.length}</b>
                                                        </button>
                                                    </div>
                                                    {openCLike && (
                                                        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                                                            <p className="text-xs text-gray-400 py-2">Comment Liked by</p>
                                                            <button onClick={() => toggleOpenCLike(el.comment_id)} className="absolute right-2">
                                                                <GrClose color="red" />
                                                            </button>
                                                            <div className="max-h-[50vh] overflow-y-auto mt-4">
                                                                {el.likedBy.length > 0 ? (
                                                                    el.likedBy.map((like, i) => (
                                                                        <div key={i} className="rounded-lg mb-2 px-4 py-2 bg-gray-200 dark:bg-gray-800">
                                                                            <Link to={`/profile/${like.username}/${like.uid}`}>
                                                                                @ {like.username}
                                                                            </Link>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="px-1 py-2">No one :(</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex w-3/4 px-2 py-3 break-words" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                                {el.comment}
                                            </div>
                                            {(el.commentBy || "aiyen?!") === userData.username && (
                                                <button
                                                    onClick={handleCommentDel}
                                                    className="text-red-700 border w-fit p-1 border-transparent transition-all duration-300 hover:border-red-700 rounded-full border-solid"
                                                >
                                                    <CommentRemove01Icon size={15} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                <p className="text-sm text-gray-500 mb-2">
                                    {post.post.comments.length} {post.post.comments.length === 1 ? "Comment" : "Comments"}
                                </p>
                            </>
                        ) : (
                            <p className="px-1 py-2">No comments</p>
                        )}
                        <form onSubmit={handleAddComment} className="flex flex-row justify-between drop-shadow-lg items-center py-3 px-2">
                            <textarea
                                required
                                rows={1}
                                style={{ resize: "none", whiteSpace: 'pre-wrap' }}
                                className="input w-10/12 px-4 py-2 rounded-full flex flex-row items-center dark:text-black"
                                type="text"
                                placeholder="Make a Comment"
                                value={comment}
                                onChange={handleCommentChange}
                            />
                            <button type="submit" className="button px-2 py-2 text-lg bg-transparent hover:bg-gray-200 rounded-full transition-all duration-300">
                                <CommentAdd01Icon />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    });

    return (
        <div className="px-10 relative z-10 py-5 bg-white-200 dark:bg-gray-800 flex flex-col justify-center items-center mb-12">
            <Nav />
            <Toaster />
            <h1 className="text-6xl mb-4 mt-20">Feed</h1>

            <Link
                to='/post'
                className="drop-shadow-md bg-yellow-100 dark:bg-slate-600 dark:text-white flex justify-center items-center w-10 h-10 rounded-full border border-black border-solid fixed bottom-16 z-40 right-10 hover:drop-shadow-xl hover:bg-gray-100 hover:rotate-90"
            >
                <FaPlus />
            </Link>
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Delete Post</h3>
                        <p className="mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-10 flex flex-col-reverse justify-center items-center">
                <InfiniteScroll
                    className="w-screen flex flex-col items-center"
                    dataLength={feedPosts.length}
                    next={() => setOffset(prev => prev + limit)}
                    hasMore={hasMore}
                    loader={
                        <div className="w-full flex justify-center">
                            <Loading />
                        </div>
                    }
                    endMessage={
                        feedPosts.length > 0 && (
                            <div className="flex justify-center items-center mb-50">
                                <span className="relative">The End</span>
                            </div>
                        )
                    }
                >
                    {feedPosts.length > 0 ? (
                        feedPosts.map((post, index) => (
                            <PostItem key={post._id || index} post={post} userData={userData} index={index} />
                        ))
                    ) : (
                        !feedLoading && (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="relative mb-6">
                                    <FaRegNewspaper
                                        className="text-6xl text-gray-400 dark:text-gray-500 animate-float"
                                    />
                                    <FaSearch
                                        className="absolute -bottom-2 -right-2 text-2xl text-blue-500 animate-pulse opacity-90"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    No Posts Found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                                    It seems quiet here. Be the first to share something!
                                </p>
                                <Link
                                    to="/post"
                                    className="flex items-center gap-2 mt-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    <FaPlus className="text-sm" />
                                    Create New Post
                                </Link>
                            </div>
                        )
                    )}
                    {feedLoading && <Post_skel />}
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default Feed;