import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { Link, useNavigate } from "react-router-dom";
import { BiInfoCircle, BiUser, BiLock } from "react-icons/bi";
import { FiLogIn } from "react-icons/fi";
import toast, { Toaster } from 'react-hot-toast';
import fetchData from "../../utils/fetch_data";
import url from "../../utils/url";
import Nav from "../Navbar/Nav";
import Loading from "../Loader/Loading";

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [cookies, setCookie] = useCookies(['sociotoken']);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Authenticating...", {
      position: "top-center",
      style: { background: '#333', color: '#fff' }
    });

    try {
      const data = await fetchData(`${url}/login`, formData, 'POST');
      if (data?.token) {
        setCookie('sociotoken', data.token, { path: '/', maxAge: 86400 });
        setCookie('socio-user', formData.username, { path: '/', maxAge: 86400 });
        toast.dismiss(loadingToast);
        toast.success("Login successful! Redirecting...", {
          position: "top-center",
          duration: 2000,
          style: { background: '#4BB543', color: '#fff' }
        });
        setTimeout(() => navigate('/'), 1500);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Login failed. Please try again.", {
        position: "top-center",
        duration: 3000,
        style: { background: '#FF3333', color: '#fff' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-yellow-300 dark:from-gray-700 dark:to-gray-900 dark:text-white flex flex-col items-center justify-center p-4">
      <Nav />
      <Toaster />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full max-w-md"
      >
        <motion.div variants={fadeInUp} className="text-center mb-2 flex items-center justify-center text-sm">
          <BiInfoCircle className="mr-1" size={17} />
          <span>Check out the </span>
          <Link to="/info" className="hover:text-blue-500 underline mx-1 font-medium">Info Page</Link>
          <span>for details about Socio</span>
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-8">
          <motion.h1 variants={fadeInUp} className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Welcome Back
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={fadeInUp}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BiUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-300 shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? <Loading size="small" /> : (<><FiLogIn className="mr-2" />Log In</>)}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={fadeInUp} className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-300">New to Socio? </span>
            <Link to="/signup" className="font-medium text-purple-600 dark:text-purple-400 hover:underline">Create an account</Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
