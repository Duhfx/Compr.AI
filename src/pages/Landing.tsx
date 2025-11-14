import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Sparkles,
  Users,
  Camera,
  History,
  TrendingDown,
  Zap,
  Share2,
  Brain,
  Receipt,
  Check,
  ArrowRight,
  Smartphone,
  Shield,
  Cloud
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

  const mainFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Sugestões Inteligentes',
      description: 'IA analisa seu histórico e sugere itens automaticamente',
      gradient: 'from-purple-500 to-indigo-600',
      highlight: 'Powered by Gemini AI'
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: 'Escaneie Notas Fiscais',
      description: 'Tire foto da nota e extraia produtos e preços automaticamente',
      gradient: 'from-blue-500 to-cyan-600',
      highlight: 'OCR + IA'
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: 'Compartilhamento Real-time',
      description: 'Colabore com família e amigos em tempo real',
      gradient: 'from-pink-500 to-rose-600',
      highlight: 'Sincronização instantânea'
    },
    {
      icon: <TrendingDown className="w-8 h-8" />,
      title: 'Análise de Preços',
      description: 'Compare preços ao longo do tempo e economize',
      gradient: 'from-green-500 to-emerald-600',
      highlight: 'Histórico completo'
    }
  ];

  const features = [
    { icon: <Zap />, text: 'Criação com IA' },
    { icon: <Receipt />, text: 'OCR de notas' },
    { icon: <History />, text: 'Histórico completo' },
    { icon: <Smartphone />, text: 'Funciona offline' },
    { icon: <Shield />, text: 'Dados seguros' },
    { icon: <Cloud />, text: 'Sync na nuvem' }
  ];

  const stats = [
    { number: '10x', label: 'Mais rápido' },
    { number: '100%', label: 'Grátis' },
    { number: '24/7', label: 'Disponível' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Mobile App Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-indigo-700 pb-20">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-md mx-auto px-6 pt-12">
          {/* App Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.8
            }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 bg-white rounded-[28px] shadow-2xl flex items-center justify-center">
              <ShoppingCart className="w-14 h-14 text-primary" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-4"
          >
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
              Compr.AI
            </h1>
            <p className="text-xl text-white/90 font-medium">
              Suas compras com
              <span className="block text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center gap-8 mb-10"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-black text-white mb-1">{stat.number}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            <button
              onClick={() => navigate('/register')}
              className="w-full h-16 bg-white text-primary rounded-[20px] text-lg font-bold shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight className="w-5 h-5 group-active:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-16 bg-white/10 backdrop-blur-xl text-white rounded-[20px] text-lg font-semibold border-2 border-white/20 active:scale-[0.98] transition-all"
            >
              Já tenho conta
            </button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.05 }}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center gap-2 text-white text-sm font-medium"
              >
                {feature.icon && <span className="w-4 h-4">{feature.icon}</span>}
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="max-w-md mx-auto px-6 -mt-10 mb-16">
        <div className="space-y-4">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] blur-xl"
                   style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />

              <div className="relative bg-white rounded-[24px] p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-[18px] bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {feature.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Sparkles className="w-3 h-3" />
                      {feature.highlight}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-black text-gray-900 mb-3">
              Como funciona
            </h2>
            <p className="text-gray-600">
              Simples, rápido e inteligente
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Crie sua lista',
                description: 'Digite o que precisa ou deixe a IA sugerir baseado no seu histórico',
                icon: <ShoppingCart className="w-6 h-6" />
              },
              {
                step: '2',
                title: 'Escaneia notas fiscais',
                description: 'Tire foto de notas antigas e a IA extrai produtos e preços automaticamente',
                icon: <Camera className="w-6 h-6" />
              },
              {
                step: '3',
                title: 'Compartilhe',
                description: 'Envie link para família e amigos colaborarem em tempo real',
                icon: <Users className="w-6 h-6" />
              },
              {
                step: '4',
                title: 'Economize',
                description: 'Compare preços e veja seu histórico de gastos completo',
                icon: <TrendingDown className="w-6 h-6" />
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <span className="text-primary">{item.icon}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black text-gray-900 mb-3">
              Por que você vai amar
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🚀', text: 'Super rápido' },
              { icon: '🧠', text: 'IA integrada' },
              { icon: '📸', text: 'OCR de notas' },
              { icon: '👥', text: 'Colaborativo' },
              { icon: '📊', text: 'Análise preços' },
              { icon: '💾', text: 'Modo offline' },
              { icon: '🔒', text: '100% seguro' },
              { icon: '🎯', text: 'Fácil de usar' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-[20px] p-6 text-center border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-2">{benefit.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{benefit.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof / Trust Section */}
      <div className="bg-gradient-to-br from-primary to-purple-600 py-16">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-xl rounded-[28px] p-8 border border-white/20"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                Tecnologia de ponta
              </h3>
              <p className="text-white/80 text-sm">
                Powered by Google Gemini AI
              </p>
            </div>

            <div className="space-y-3">
              {[
                'Sugestões personalizadas baseadas em ML',
                'OCR com precisão de 95%+',
                'Sincronização em tempo real',
                'Funciona 100% offline'
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3 text-white"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Junte-se a milhares de pessoas que já estão economizando tempo e dinheiro
            </p>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full h-16 bg-gradient-to-r from-primary to-purple-600 text-white rounded-[20px] text-lg font-bold shadow-2xl hover:shadow-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
              >
                <span>Criar Conta Grátis</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>

              <p className="text-sm text-gray-500">
                Sem cartão de crédito • Grátis para sempre
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-white" />
              <span className="text-xl font-bold text-white">Compr.AI</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Suas compras com inteligência artificial
            </p>
            <div className="flex items-center justify-center gap-6 text-gray-500 text-xs">
              <span>© 2025 Compr.AI</span>
              <span>•</span>
              <span>Feito com ❤️ no Brasil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
