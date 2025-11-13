import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Sparkles,
  Users,
  TrendingUp,
  Smartphone,
  Zap,
  Check,
  ArrowRight
} from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('[Landing] User authenticated, redirecting to home');
      navigate('/home');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-700">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (user) {
    return null;
  }

  const features = [
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Listas Inteligentes',
      description: 'Crie e organize suas listas de compras de forma simples e intuitiva'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Sugestões com IA',
      description: 'Receba sugestões personalizadas baseadas no seu histórico de compras'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Compartilhamento',
      description: 'Compartilhe listas com familiares e amigos em tempo real'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Histórico de Preços',
      description: 'Acompanhe a evolução de preços dos seus produtos favoritos'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Funciona Offline',
      description: 'Use em qualquer lugar, mesmo sem conexão com a internet'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Rápido e Eficiente',
      description: 'Interface otimizada para agilizar suas compras'
    }
  ];

  const benefits = [
    'Economize tempo no supermercado',
    'Nunca esqueça um item importante',
    'Compare preços facilmente',
    'Organize compras em família',
    'Acesse de qualquer dispositivo'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-purple-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-screen-sm mx-auto px-6 py-12">
          {/* Logo/Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl mb-6">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Compr.AI
            </h1>
            <p className="text-xl text-white text-opacity-90 mb-8">
              Seu assistente inteligente de compras
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 mb-16"
          >
            <button
              onClick={() => navigate('/register')}
              className="w-full h-14 bg-white text-primary rounded-2xl text-lg font-bold shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 group"
            >
              Começar agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-14 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl text-lg font-semibold border-2 border-white border-opacity-30 active:scale-95 transition-transform"
            >
              Já tenho conta
            </button>
          </motion.div>

          {/* Benefits List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 mb-12"
          >
            <h3 className="text-white text-lg font-semibold mb-4 text-center">
              Por que usar o Compr.AI?
            </h3>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 text-white"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-screen-sm mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-gray-600">
              Tudo que você precisa para otimizar suas compras
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-br from-primary to-purple-700 py-16">
        <div className="max-w-screen-sm mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-white text-opacity-90 mb-8">
              Crie sua conta gratuitamente e comece a organizar suas compras agora mesmo
            </p>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-8 h-14 bg-white text-primary rounded-2xl text-lg font-bold shadow-2xl hover:shadow-3xl active:scale-95 transition-all"
            >
              Criar conta grátis
              <Sparkles className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-screen-sm mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Compr.AI - Seu assistente de compras inteligente
          </p>
        </div>
      </div>
    </div>
  );
};
