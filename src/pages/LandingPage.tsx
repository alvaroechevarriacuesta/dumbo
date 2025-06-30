import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Database, 
  FolderOpen, 
  Chrome, 
  Search, 
  Brain, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  FileText,
  Globe,
  Zap,
  BookOpen,
  Archive,
  Target,
  Shield,
  Wifi,
  WifiOff,
  Eye,
  Plus,
  ChevronDown,
  Star,
  Quote,
  LogOut
} from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate through steps
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: Plus,
      title: "Add the Extension",
      description: "Install our Chrome extension with one click"
    },
    {
      icon: Archive,
      title: "Save Content",
      description: "Save web pages or upload documents to your contexts"
    },
    {
      icon: FolderOpen,
      title: "Toggle Contexts",
      description: "Switch between different knowledge contexts"
    },
    {
      icon: MessageCircle,
      title: "Chat & Retrieve",
      description: "Get answers sourced only from your saved content"
    }
  ];

  const features = [
    {
      icon: WifiOff,
      title: "Offline First",
      description: "Use your data, even without internet connection"
    },
    {
      icon: Archive,
      title: "Save for Later",
      description: "Instantly save any web page or document with Cmd+J"
    },
    {
      icon: FolderOpen,
      title: "Isolated Contexts",
      description: "Keep research, work, and personal docs completely separate"
    }
  ];

  const comparisonData = [
    { feature: "Works offline", us: true, others: false },
    { feature: "Only uses your saved content", us: true, others: false },
    { feature: "No hallucinations", us: true, others: false },
    { feature: "Context switching", us: true, others: false },
    { feature: "Chrome extension", us: true, others: false },
    { feature: "Transparent sources", us: true, others: false }
  ];

  const testimonials = [
    {
      quote: "Finally, an AI that only tells me what I've saved. No more guessing where information comes from.",
      author: "Dr. Sarah Chen",
      role: "Research Scientist",
      avatar: "SC"
    },
    {
      quote: "Game-changer for my thesis research. I can chat with my papers and always know the exact source.",
      author: "Marcus Rodriguez",
      role: "PhD Student",
      avatar: "MR"
    }
  ];

  const faqs = [
    {
      question: "How does offline functionality work?",
      answer: "Once you've saved content to your contexts, all chat functionality works offline. Your data is stored locally and processed without internet connection."
    },
    {
      question: "Is my data private and secure?",
      answer: "Absolutely. Your contexts and documents are stored securely and never shared. You have complete control over your knowledge base."
    },
    {
      question: "Can I have multiple contexts?",
      answer: "Yes! Create unlimited contexts for different projects, topics, or areas of interest. Each context is completely isolated from others."
    },
    {
      question: "What file types are supported?",
      answer: "Currently we support PDF documents and text files. We're continuously adding support for more file types based on user feedback."
    },
    {
      question: "How is this different from ChatGPT?",
      answer: "Unlike general AI chatbots, our assistant only uses content you've explicitly saved. No hallucinations, no unreliable sources - just your curated knowledge base."
    }
  ];

  return (
    <div className="min-h-screen bg-secondary-900 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-secondary-900/95 backdrop-blur-sm border-b border-secondary-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/dumbo-logo.svg" 
                alt="Dumbo Logo" 
                className="h-8 w-auto"
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-secondary-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-secondary-300 hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="text-secondary-300 hover:text-white transition-colors">FAQ</a>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-secondary-300">Welcome, {user?.username}</span>
                  <Link to="/chat">
                    <Button className="bg-primary-600 hover:bg-primary-700">
                      Go to Chat
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="text-secondary-300 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    Get Extension
                  </Button>
                </Link>
              )}
            </div>

            <div className="md:hidden">
              {isAuthenticated ? (
                <Link to="/chat">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Go to Chat
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center space-x-2 bg-primary-900/30 border border-primary-700 text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                <span>No Unreliable Sources</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                Chat with Your 
                <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  Own Knowledge.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-secondary-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                An AI chat assistant that only answers from your saved web pages and documents. 
                Works offline. No unreliable sources. Keep your concepts separate.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                {isAuthenticated ? (
                  <>
                    <Link to="/chat">
                      <Button size="lg" className="px-8 py-4 text-lg bg-primary-600 hover:bg-primary-700">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Go to Chat
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-secondary-600 text-secondary-300 hover:bg-secondary-800">
                        <Chrome className="w-5 h-5 mr-2" />
                        Get Extension
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button size="lg" className="px-8 py-4 text-lg bg-primary-600 hover:bg-primary-700">
                        <Chrome className="w-5 h-5 mr-2" />
                        Get the Extension
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-secondary-600 text-secondary-300 hover:bg-secondary-800">
                        See How It Works
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-secondary-800 rounded-2xl border border-secondary-700 overflow-hidden shadow-2xl">
              <div className="flex items-center space-x-3 px-6 py-4 bg-secondary-900 border-b border-secondary-700">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-secondary-400 ml-4">Research Context - AI Safety</span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-end">
                  <div className="bg-primary-600 rounded-2xl rounded-br-md px-6 py-4 max-w-md">
                    <p className="text-white">What are the main alignment challenges discussed in my saved papers?</p>
                  </div>
                </div>
                
                <div className="flex justify-start">
                  <div className="bg-secondary-700 rounded-2xl rounded-bl-md px-6 py-4 max-w-2xl">
                    <p className="text-secondary-100 mb-4">
                      Based on your AI safety research context, the main alignment challenges include:
                      <br />• Reward hacking and specification gaming
                      <br />• Distributional shift and robustness
                      <br />• Mesa-optimization and inner alignment
                    </p>
                    <div className="text-sm text-secondary-400 border-l-2 border-primary-500 pl-3">
                      <strong>Sources:</strong> "Alignment Paper 2024.pdf", "Safety Research.pdf"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary-600/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-accent-600/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary-600/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-secondary-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built for Your Personal Knowledge
            </h2>
            <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
              Three core features that make your AI assistant truly yours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative p-8 bg-secondary-900 rounded-2xl border border-secondary-700 hover:border-primary-600 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-secondary-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
              Four simple steps to build your personal AI knowledge base
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative text-center transition-all duration-500 ${
                  activeStep === index ? 'scale-105' : ''
                }`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                  activeStep === index 
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 shadow-lg shadow-primary-600/25' 
                    : 'bg-secondary-800 border border-secondary-700'
                }`}>
                  <step.icon className={`w-10 h-10 ${
                    activeStep === index ? 'text-white' : 'text-secondary-400'
                  }`} />
                </div>
                <div className="text-sm text-primary-400 font-medium mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-secondary-300">
                  {step.description}
                </p>
                
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-secondary-700 -translate-x-1/2 z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-1000"
                      style={{ 
                        width: activeStep > index ? '100%' : '0%' 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-20 bg-secondary-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose Personal Contexts?
            </h2>
            <p className="text-xl text-secondary-300">
              See how we compare to generic AI chatbots
            </p>
          </div>

          <div className="bg-secondary-900 rounded-2xl border border-secondary-700 overflow-hidden">
            <div className="grid grid-cols-3 bg-secondary-800 border-b border-secondary-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Feature</h3>
              </div>
              <div className="p-6 border-l border-secondary-700 bg-primary-900/20">
                <h3 className="text-lg font-semibold text-primary-400">This Chatbot</h3>
              </div>
              <div className="p-6 border-l border-secondary-700">
                <h3 className="text-lg font-semibold">Others</h3>
              </div>
            </div>
            
            {comparisonData.map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-b border-secondary-700 last:border-b-0">
                <div className="p-6">
                  <span className="text-secondary-300">{row.feature}</span>
                </div>
                <div className="p-6 border-l border-secondary-700 bg-primary-900/10">
                  <div className="flex items-center">
                    {row.us ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-secondary-600"></div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-l border-secondary-700">
                  <div className="flex items-center">
                    {row.others ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-secondary-600"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Knowledge Workers
            </h2>
            <p className="text-xl text-secondary-300">
              Used by researchers, students, analysts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-secondary-800 rounded-2xl p-8 border border-secondary-700">
                <Quote className="w-8 h-8 text-primary-400 mb-6" />
                <p className="text-lg text-secondary-200 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-secondary-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Logo Cloud */}
          <div className="mt-16 text-center">
            <p className="text-secondary-400 mb-8">Used by professionals at</p>
            <div className="flex items-center justify-center space-x-12 opacity-50">
              <div className="text-2xl font-bold">Stanford</div>
              <div className="text-2xl font-bold">MIT</div>
              <div className="text-2xl font-bold">Google</div>
              <div className="text-2xl font-bold">OpenAI</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 py-20 bg-secondary-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary-300">
              Everything you need to know about personal AI contexts
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-secondary-900 rounded-xl border border-secondary-700 overflow-hidden">
                <button
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-secondary-800 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-secondary-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Control Your AI Knowledge Base?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Start building your personal contexts today. No hallucinations. No unreliable sources. Your knowledge, your rules.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/chat">
                  <Button 
                    size="lg" 
                    className="px-8 py-4 text-lg bg-white text-primary-600 hover:bg-primary-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Go to Chat
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    <Chrome className="w-5 h-5 mr-2" />
                    Get Extension
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="px-8 py-4 text-lg bg-white text-primary-600 hover:bg-primary-50"
                  >
                    <Chrome className="w-5 h-5 mr-2" />
                    Get the Extension
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-primary-600"
                  >
                    Try Web Version
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-secondary-950 border-t border-secondary-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/dumbo-logo.svg" 
                alt="Dumbo Logo" 
                className="h-6 w-auto"
              />
            </div>
            
            <div className="flex items-center space-x-8 mb-4 md:mb-0">
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors">Support</a>
            </div>
            
            <p className="text-secondary-400 text-sm">
              © 2025 Dumbo. Your personal AI context assistant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;