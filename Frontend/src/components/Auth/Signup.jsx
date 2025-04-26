import { useState } from "react";
import fetchData from "../../utils/fetch_data";
import url from "../../utils/url";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../Navbar/Nav";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

const SignupForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agrees, setAgrees] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    if (name === 'password') setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agrees) {
      toast.error("You must agree to the Terms & Conditions");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      toast.loading("Signing you up...");
      const data = await fetchData(`${url}/signup`, { username, password }, 'POST');
      toast.dismiss();

      if (data.message > 1000) {
        toast.error(data.message === 11000 ? `Username '${username}' already exists` : "Signup failed");
        setTimeout(() => navigate('/signup'), 1000);
      } else {
        toast.success("Signup successful!");
        setTimeout(() => navigate('/login'), 1000);
      }

    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Signup failed");
      setError(err.message);
      setTimeout(() => navigate('/signup'), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-yellow-200 to-pink-100 dark:from-gray-800 dark:to-gray-700 min-h-screen flex flex-col justify-center items-center p-4">
      <Nav />
      <Toaster />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, duration: 0.5 }}
        className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 dark:text-white">
          Create Your <span className="text-pink-500 italic">Socio</span> Account
        </h1>

        <input
          type="text"
          name="username"
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
          onChange={handleInputChange}
          placeholder="Username"
          required
        />

        <input
          type="password"
          name="password"
          className="w-full mb-4 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
          onChange={handleInputChange}
          placeholder="Password"
          required
        />

        <div className="flex items-center mb-4">
          <input
            id="agree-checkbox"
            type="checkbox"
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-600"
            onChange={() => setAgrees(!agrees)}
          />
          <label htmlFor="agree-checkbox" className="ml-2 text-sm text-gray-800 dark:text-gray-300">
            I agree to the{" "}
            <a
              href="/t&c.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:underline"
            >
              Terms & Conditions
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={!agrees || isLoading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
            agrees ? "bg-pink-500 hover:bg-pink-600" : "bg-pink-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Signing Up..." : "Sign Up"}
        </button>

        {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
      </motion.form>

      <motion.div
        className="mt-6 text-sm text-gray-700 dark:text-gray-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Already have an account?
        <Link to="/login" className="ml-1 text-pink-600 hover:underline font-medium">
          Log In
        </Link>
      </motion.div>
    </div>
  );
};

export default SignupForm;
