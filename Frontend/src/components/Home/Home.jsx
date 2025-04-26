import { useEffect, useRef, useState } from "react";
import { useIsVisible } from "../../utils/IsVisible";
import './home.css';
import Nav from "../Navbar/Nav";
import { FaRightLong, FaPlus, FaQuoteLeft, FaStar } from "react-icons/fa6";
import { GrDown } from "react-icons/gr";
import { Link } from "react-router-dom";
import checkAuth from "../../utils/checkAuth";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const sectionRefs = Array(5).fill().map(() => useRef());
    const isVisible = sectionRefs.map(ref => useIsVisible(ref));

    useEffect(() => {
        setIsAuthenticated(checkAuth());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            title: "Make new Friends!",
            content: "Connect with people that are",
            highlighted: ["Just", "Like", "You"],
            bgColor: "bg-yellow-200 dark:bg-slate-600",
            link: "/people",
            icon: <FaRightLong />,
            authRequired: true
        },
        {
            title: "Make a Post!",
            content: "Share your thoughts",
            highlighted: ["With", "Your", "Community"],
            bgColor: "bg-purple-200 dark:bg-slate-700",
            link: "/feed",
            icon: <FaPlus />,
            authRequired: true
        },
        {
            title: "Explore Feed",
            content: "Discover content",
            highlighted: ["You'll", "Love"],
            bgColor: "bg-red-200 dark:bg-slate-800",
            link: "/feed",
            icon: <GrDown className="-rotate-90" />,
            authRequired: false
        }
    ];

    const testimonials = [
        {
            name: "Alex Johnson",
            role: "Social Media Enthusiast",
            content: "This platform completely changed how I connect with like-minded people. The community is amazing!",
            rating: 5
        },
        {
            name: "Sam Wilson",
            role: "Content Creator",
            content: "I've never found a more engaging platform to share my thoughts and get genuine feedback.",
            rating: 4
        },
        {
            name: "Taylor Smith",
            role: "Digital Nomad",
            content: "Perfect for meeting new friends while traveling. The interface is so intuitive!",
            rating: 5
        }
    ];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const staggerContainer = {
        visible: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="relative w-full overflow-hidden">
            <Nav />
            
            {/* Hero Section */}
            <motion.section 
                ref={sectionRefs[0]}
                initial="hidden"
                animate={isVisible[0] ? "visible" : "hidden"}
                variants={staggerContainer}
                className="min-h-screen w-full flex flex-col justify-center items-center px-4 md:px-12 py-16 bg-gradient-to-br from-blue-400 to-purple-500 dark:from-slate-800 dark:to-slate-900 text-white"
            >
                <motion.div className="max-w-6xl mx-auto text-center">
                    <motion.h1 
                        variants={fadeIn}
                        className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight"
                    >
                        Connect with your <h1 className="text-yellow-300">perfect</h1> community
                    </motion.h1>
                    
                    <motion.p 
                        variants={fadeIn}
                        className="text-xl md:text-2xl lg:text-3xl mb-12 max-w-3xl mx-auto"
                    >
                        Join thousands who've found meaningful connections through our platform
                    </motion.p>
                    
                    <motion.div variants={fadeIn}>
                        <Link 
                            to={isAuthenticated ? "/feed" : "/login"}
                            className="inline-block px-8 py-4 bg-white text-purple-600 dark:bg-slate-700 dark:text-white rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div 
                    variants={fadeIn}
                    className="absolute bottom-10 animate-bounce"
                >
                    <GrDown className="text-2xl" />
                </motion.div>
            </motion.section>

            {/* Features Sections */}
            {features.map((feature, index) => (
                <motion.section 
                    key={index}
                    ref={sectionRefs[index + 1]}
                    initial="hidden"
                    animate={isVisible[index + 1] ? "visible" : "hidden"}
                    variants={staggerContainer}
                    className={`min-h-screen w-full flex flex-col justify-center items-center px-4 md:px-12 py-16 ${feature.bgColor} dark:text-white text-black`}
                >
                    <motion.div className="max-w-6xl mx-auto">
                        <motion.h1 
                            variants={fadeIn}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-center"
                        >
                            {feature.title}
                        </motion.h1>
                        
                        <motion.div 
                            className={`flex flex-col md:flex-row justify-center items-center w-full transition-all duration-700`}
                            variants={staggerContainer}
                        >
                            <motion.div 
                                variants={fadeIn}
                                className="text-2xl md:text-4xl text-center md:text-left mb-8 md:mb-0 md:mr-12"
                            >
                                {feature.content} 
                                <div className="flex flex-wrap justify-center md:justify-start items-center mt-4">
                                    {feature.highlighted.map((word, i) => (
                                        <motion.span 
                                            key={i} 
                                            className={`mx-2 px-3 py-1 rounded-lg ${i === feature.highlighted.length - 1 ? "bg-white bg-opacity-20 dark:bg-opacity-30" : ""}`}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                variants={fadeIn}
                                whileHover={{ scale: 1.1 }}
                                className="text-4xl md:text-5xl"
                            >
                                <Link 
                                    to={isAuthenticated || !feature.authRequired ? feature.link : "/login"}
                                    className="inline-block p-4 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300"
                                >
                                    {feature.icon}
                                </Link>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.section>
            ))}

            {/* Testimonials Section */}
            <motion.section 
                ref={sectionRefs[4]}
                initial="hidden"
                animate={isVisible[4] ? "visible" : "hidden"}
                className="min-h-screen w-full flex flex-col justify-center items-center px-4 md:px-12 py-16 bg-green-100 dark:bg-slate-900"
            >
                <motion.div 
                    variants={fadeIn}
                    className="max-w-6xl mx-auto text-center"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">What Our Users Say</h2>
                    <p className="text-xl md:text-2xl mb-12 text-gray-600 dark:text-gray-300">Join thousands of satisfied users worldwide</p>
                    
                    <div className="relative h-64 md:h-80 w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTestimonial}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg"
                            >
                                <FaQuoteLeft className="text-3xl text-gray-400 mb-4" />
                                <p className="text-lg md:text-xl mb-6">{testimonials[activeTestimonial].content}</p>
                                <div className="flex mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar 
                                            key={i} 
                                            className={`text-xl ${i < testimonials[activeTestimonial].rating ? "text-yellow-400" : "text-gray-300"}`} 
                                        />
                                    ))}
                                </div>
                                <h3 className="text-xl font-semibold">{testimonials[activeTestimonial].name}</h3>
                                <p className="text-gray-500">{testimonials[activeTestimonial].role}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-center mt-8 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTestimonial(index)}
                                className={`w-3 h-3 rounded-full ${index === activeTestimonial ? "bg-blue-500" : "bg-gray-300"}`}
                                aria-label={`View testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </motion.section>
        </div>
    );
};

export default Home;