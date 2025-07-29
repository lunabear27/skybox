"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Navigation animation
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );

      // Hero section animations
      const heroTimeline = gsap.timeline();
      heroTimeline
        .fromTo(
          ".hero-title",
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
        )
        .fromTo(
          ".hero-subtitle",
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
          "-=0.8"
        )
        .fromTo(
          ".hero-description",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.6"
        )
        .fromTo(
          ".hero-button",
          { y: 30, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
          "-=0.4"
        );

      // Features section animation
      gsap.fromTo(
        ".feature-card",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // About section animation
      gsap.fromTo(
        ".about-content",
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: aboutRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Contact section animation
      gsap.fromTo(
        ".contact-form",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contactRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // CTA section animation
      gsap.fromTo(
        ".cta-content",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Footer animation
      gsap.fromTo(
        footerRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Floating animation for hero elements
      gsap.to(".floating", {
        y: -5,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log("Contact form submitted:", contactForm);
    alert("Thank you for your message! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-gradient-to-br from-[#F2F6FA] to-[#3DA9FC]/20"
    >
      {/* Navigation */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-[#F9F9F9]/90 backdrop-blur-sm border-b border-[#3DA9FC]/20"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <Image
              src="/logo1.png"
              alt="Skybox Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-bold text-[#1C1C1C]">Skybox</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => scrollToSection("features")}
            className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("about")}
            className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors"
          >
            Contact
          </button>
          <Link
            href="/sign-in"
            className="bg-[#3DA9FC] text-[#F9F9F9] px-4 py-2 rounded-lg hover:bg-[#0077C2] transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6 text-[#1C1C1C]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-[#F9F9F9]/95 backdrop-blur-sm border-b border-[#3DA9FC]/20">
          <div className="flex flex-col space-y-4 p-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors text-left"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors text-left"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-[#1C1C1C]/70 hover:text-[#1C1C1C] transition-colors text-left"
            >
              Contact
            </button>
            <Link
              href="/sign-in"
              className="bg-[#3DA9FC] text-[#F9F9F9] px-4 py-2 rounded-lg hover:bg-[#0077C2] transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="hero-title text-5xl md:text-6xl font-bold text-[#1C1C1C] mb-8 leading-tight">
            Welcome to the Future of
            <span className="hero-subtitle text-[#3DA9FC] block floating mb-4">
              Cloud Storage
            </span>
          </h1>
          <p className="hero-description text-xl text-[#1C1C1C]/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Skybox provides secure, fast, and reliable cloud storage solutions
            for individuals and businesses. Store, sync, and share your files
            with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <button className="hero-button px-8 py-4 bg-[#3DA9FC] text-[#F9F9F9] font-semibold rounded-lg hover:bg-[#0077C2] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started Free
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="hero-button px-8 py-4 border-2 border-[#3DA9FC] text-[#3DA9FC] font-semibold rounded-lg hover:bg-[#3DA9FC] hover:text-[#F9F9F9] transition-all duration-200">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        id="features"
        className="py-20 px-6 bg-[#F9F9F9]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="features-title text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">
              Why Choose Skybox?
            </h2>
            <p className="features-title text-xl text-[#1C1C1C]/70 max-w-2xl mx-auto">
              Experience the perfect blend of security, performance, and
              simplicity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#3DA9FC]/10 hover:border-[#3DA9FC]/30">
              <div className="w-16 h-16 bg-[#3DA9FC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#3DA9FC]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Bank-Level Security
              </h3>
              <p className="text-[#1C1C1C]/70">
                Your files are protected with enterprise-grade encryption and
                security protocols.
              </p>
            </div>

            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#29C393]/10 hover:border-[#29C393]/30">
              <div className="w-16 h-16 bg-[#29C393]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#29C393]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Lightning Fast
              </h3>
              <p className="text-[#1C1C1C]/70">
                Upload and download files at incredible speeds with our global
                CDN network.
              </p>
            </div>

            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#0077C2]/10 hover:border-[#0077C2]/30">
              <div className="w-16 h-16 bg-[#0077C2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#0077C2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Easy Sharing
              </h3>
              <p className="text-[#1C1C1C]/70">
                Share files and collaborate with your team seamlessly across all
                devices.
              </p>
            </div>

            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#FF6B35]/10 hover:border-[#FF6B35]/30">
              <div className="w-16 h-16 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#FF6B35]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Automatic Backup
              </h3>
              <p className="text-[#1C1C1C]/70">
                Never lose your files with automatic backup and version control.
              </p>
            </div>

            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#9C27B0]/10 hover:border-[#9C27B0]/30">
              <div className="w-16 h-16 bg-[#9C27B0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#9C27B0]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Mobile Access
              </h3>
              <p className="text-[#1C1C1C]/70">
                Access your files anywhere with our mobile apps for iOS and
                Android.
              </p>
            </div>

            <div className="feature-card text-center p-6 bg-[#F2F6FA] rounded-xl hover:shadow-lg transition-all duration-300 border border-[#4CAF50]/10 hover:border-[#4CAF50]/30">
              <div className="w-16 h-16 bg-[#4CAF50]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#4CAF50]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                Analytics & Insights
              </h3>
              <p className="text-[#1C1C1C]/70">
                Get detailed insights into your storage usage and file activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} id="about" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="about-content">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-6">
                About Skybox
              </h2>
              <p className="text-lg text-[#1C1C1C]/70 mb-6 leading-relaxed">
                Skybox was founded with a simple mission: to make cloud storage
                secure, fast, and accessible to everyone. We believe that your
                digital files deserve the same level of protection and care as
                your physical possessions.
              </p>
              <p className="text-lg text-[#1C1C1C]/70 mb-6 leading-relaxed">
                Our team of experts has built a platform that combines
                enterprise-grade security with intuitive design, ensuring that
                both individuals and businesses can trust us with their most
                important data.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#3DA9FC] mb-2">
                    10M+
                  </div>
                  <div className="text-[#1C1C1C]/70">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#3DA9FC] mb-2">
                    99.9%
                  </div>
                  <div className="text-[#1C1C1C]/70">Uptime</div>
                </div>
              </div>
            </div>
            <div className="about-content">
              <div className="bg-gradient-to-br from-[#3DA9FC]/10 to-[#0077C2]/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-[#1C1C1C] mb-4">
                  Our Values
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#3DA9FC] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">
                        Security First
                      </h4>
                      <p className="text-[#1C1C1C]/70">
                        Your data security is our top priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#3DA9FC] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">
                        User Experience
                      </h4>
                      <p className="text-[#1C1C1C]/70">
                        Simple, intuitive, and powerful
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#3DA9FC] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">
                        Innovation
                      </h4>
                      <p className="text-[#1C1C1C]/70">
                        Constantly improving and evolving
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        ref={contactRef}
        id="contact"
        className="py-20 px-6 bg-[#F9F9F9]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-[#1C1C1C]/70 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="contact-form">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[#1C1C1C] mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-[#3DA9FC]/20 rounded-lg focus:ring-2 focus:ring-[#3DA9FC] focus:border-transparent transition-all duration-200"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#1C1C1C] mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-[#3DA9FC]/20 rounded-lg focus:ring-2 focus:ring-[#3DA9FC] focus:border-transparent transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-[#1C1C1C] mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-[#3DA9FC]/20 rounded-lg focus:ring-2 focus:ring-[#3DA9FC] focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-[#3DA9FC] text-white font-semibold rounded-lg hover:bg-[#0077C2] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div className="contact-form">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-[#1C1C1C] mb-6">
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[#3DA9FC]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-[#3DA9FC]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">Email</h4>
                      <p className="text-[#1C1C1C]/70">support@skybox.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[#3DA9FC]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-[#3DA9FC]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">Phone</h4>
                      <p className="text-[#1C1C1C]/70">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-[#3DA9FC]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-[#3DA9FC]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1C1C1C]">Address</h4>
                      <p className="text-[#1C1C1C]/70">
                        123 Cloud Street
                        <br />
                        Tech City, TC 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 px-6 bg-[#0A1A2F]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="cta-content">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F9F9F9] mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-[#F9F9F9]/80 mb-8">
              Join thousands of users who trust Skybox with their most important
              files.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <button className="px-8 py-4 bg-[#3DA9FC] text-[#F9F9F9] font-semibold rounded-lg hover:bg-[#0077C2] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Start Your Free Trial
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="px-8 py-4 border-2 border-[#3DA9FC] text-[#3DA9FC] font-semibold rounded-lg hover:bg-[#3DA9FC] hover:text-[#F9F9F9] transition-all duration-200">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        ref={footerRef}
        className="py-12 px-6 bg-[#0A1A2F] text-[#F9F9F9]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Image
                    src="/logo1.png"
                    alt="Skybox Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-xl font-bold">Skybox</span>
              </div>
              <p className="text-[#F9F9F9]/70 mb-4">
                Secure, fast, and reliable cloud storage for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[#F9F9F9]/70">
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[#F9F9F9]/70">
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-[#F9F9F9]/70">
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Status
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#F9F9F9] transition-colors"
                  >
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#3DA9FC]/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#F9F9F9]/70 mb-4 md:mb-0">
              &copy; 2024 Skybox. All rights reserved.
            </p>
            <div className="flex space-x-6 text-[#F9F9F9]/70">
              <Link href="#" className="hover:text-[#F9F9F9] transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-[#F9F9F9] transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-[#F9F9F9] transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
