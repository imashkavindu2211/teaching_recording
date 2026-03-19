"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Input, Button, Typography, message as staticMessage, Card, App, Checkbox, Modal } from 'antd';
import { User, Lock, Contact, ShieldCheck, ArrowRight, UserPlus, LogIn, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeNIC } from '@/lib/utils';

const { Title, Text } = Typography;

interface AuthPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  return (
    <App>
      <AuthContent onLoginSuccess={onLoginSuccess} />
    </App>
  );
}

function AuthContent({ onLoginSuccess }: AuthPageProps) {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'admin'>('login');
  
  // Sync view state with URL search params
  useEffect(() => {
    const qView = searchParams.get('view') as 'login' | 'register' | 'forgot' | 'admin';
    if (qView && ['login', 'register', 'forgot', 'admin'].includes(qView)) {
      setView(qView);
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Registration Logic
  const handleRegister = async (values: any) => {
    setLoading(true);
    try {

      const normalizedNic = normalizeNIC(values.nic);
      // 2. Check if user already exists
      const { data: existingUser } = await supabase
        .from('students')
        .select('nic')
        .or(`nic.eq.${normalizedNic},nic.eq.${normalizedNic}V,nic.eq.${normalizedNic}v`)
        .maybeSingle();

      if (existingUser) {
        message.error("A student with this NIC is already registered.");
        return;
      }

      // 3. Register user
      const { error: regError } = await supabase
        .from('students')
        .insert([{
          nic: normalizedNic,
          fullname: values.fullname,
          password: values.password // In a real app, hash this!
        }]);

      if (regError) throw regError;

      message.success("Registration successful! You can now log in.");
      setView('login');
      form.resetFields();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login Logic
  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const normalizedNic = normalizeNIC(values.nic);
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .or(`nic.eq.${normalizedNic},nic.eq.${normalizedNic}V,nic.eq.${normalizedNic}v`)
        .eq('password', values.password)
        .maybeSingle();

      if (error || !student) {
        message.error("Invalid NIC or Password.");
        return;
      }

      message.success(`Welcome back, ${student.fullname}`);
      localStorage.setItem('student_session', JSON.stringify(student));
      onLoginSuccess(student);
    } catch (error: any) {
      message.error("Connection failed. Check your network.");
    } finally {
      setLoading(false);
    }
  };
  // Forgot Password Logic
  const handleResetPassword = async (values: any) => {
    setLoading(true);
    try {
      const normalizedNic = normalizeNIC(values.nic);
      // 1. Check if user exists
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .or(`nic.eq.${normalizedNic},nic.eq.${normalizedNic}V,nic.eq.${normalizedNic}v`)
        .maybeSingle();

      if (fetchError || !student) {
        message.error("No student found with this NIC.");
        return;
      }

      // 2. Update password
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: values.newPassword })
        .eq('nic', normalizedNic);

      if (updateError) throw updateError;

      message.success("Password updated successfully! You can now log in.");
      setView('login');
      form.resetFields();
    } catch (error: any) {
      message.error("Reset failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin Login Logic
  const handleAdminLogin = async (values: any) => {
    setLoading(true);
    // Mimic the admin page security
    if (values.password === 'Admin@25258585') {
      message.success("Administrator authentication successful.");
      window.location.href = '/admin';
    } else {
      message.error("Invalid Administrative Credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-transparent font-sans flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row min-h-[650px] relative">
        
        
        {/* Toggleable Panel (Decorative) */}
        <div 
          className={`hidden md:flex absolute top-0 w-1/2 h-full bg-gradient-to-br from-[#DC143C] to-rose-700 transition-all duration-700 ease-in-out z-20 items-center justify-center p-12 text-white
            ${(view === 'register' || view === 'forgot' || view === 'admin') ? 'left-1/2 rounded-l-[5rem]' : 'left-0 rounded-r-[5rem]'}
          `}
        >
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              {view === 'register' ? <UserPlus size={40} /> : view === 'forgot' ? <RefreshCw size={40} /> : view === 'admin' ? <ShieldCheck size={40} /> : <LogIn size={40} />}
            </div>
            <Title level={1} className="!text-white !font-black !m-0 !tracking-tighter">
              {view === 'register' ? "Join the Academy" : view === 'forgot' ? "Security Recovery" : view === 'admin' ? "Admin Console" : "Welcome Back"}
            </Title>
            <p className="text-rose-50 font-medium text-lg leading-relaxed">
              {view === 'register' 
                ? "Enter your details to access the premium lesson repository and start your learning journey." 
                : view === 'forgot'
                ? "Enter your NIC and choose a new secure password to regain access to your dashboard."
                : view === 'admin'
                ? "Administrative authentication required to access the cloud database console."
                : "Sign in to resume your studies and access your specialized learning protocols."}
            </p>
            <div className="pt-8">
              <Button 
                size="large" 
                className="h-14 px-10 rounded-2xl bg-white text-black border-2 border-black font-black uppercase text-xs tracking-widest hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
              >
                {view === 'login' ? "No account? REGISTER" : "Back to LOG IN"}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 flex flex-col md:flex-row relative">
            {/* Form Container: Register (Left Side) */}
            <div className={`w-full md:w-1/2 md:absolute md:left-0 md:top-0 md:h-full p-8 md:p-20 flex flex-col justify-center transition-all duration-700 ${view !== 'register' ? 'hidden md:flex md:opacity-0 md:pointer-events-none' : 'flex opacity-100 z-10'}`}>
              <div className="mb-10">
                <Title level={2} className="!font-black !tracking-tighter !mb-2 !text-slate-900">Create Account</Title>
                <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">New Student Enrollment</Text>
              </div>

          <Form form={form} layout="vertical" onFinish={handleRegister} className="space-y-4">
            <Form.Item name="fullname" rules={[{ required: true, message: 'Full name is required' }]}>
              <Input 
                prefix={<User className="text-black mr-2" size={20} />} 
                placeholder="Student Name" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item name="nic" rules={[{ required: true, message: 'NIC is required' }]}>
              <Input 
                prefix={<Contact className="text-black mr-2" size={20} />} 
                placeholder="National ID (NIC)" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please create a password' }, { min: 6, message: 'Password must be at least 6 characters' }]}>
              <Input.Password 
                prefix={<Lock className="text-black mr-2" size={20} />} 
                placeholder="Create Account Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item 
              name="confirmPassword" 
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<ShieldCheck className="text-black mr-2" size={20} />} 
                placeholder="Confirm Account Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>

            <div className="flex items-center gap-3 mb-8 pt-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Checkbox 
                checked={isTermsAccepted} 
                onChange={(e) => {
                  if (e.target.checked) {
                    setIsTermsModalVisible(true);
                  } else {
                    setIsTermsAccepted(false);
                  }
                }}
                className="font-black text-slate-900 dark:text-slate-100 text-sm"
              >
                Terms and Conditions Request: I agree to the <span className="text-[#DC143C] underline decoration-2 underline-offset-4">Terms and Conditions</span>
              </Checkbox>
            </div>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={!isTermsAccepted}
              className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 border-none transition-all duration-500 flex items-center justify-center gap-2 ${
                isTermsAccepted 
                ? 'bg-[#DC143C] hover:bg-rose-600 shadow-[#DC143C]/20 cursor-pointer' 
                : 'bg-[#DC143C]/40 text-white/70 cursor-not-allowed shadow-none'
              }`}
            >
              Register & Enlist
            </Button>

            <div className="text-center pt-8 md:hidden border-t border-slate-100 mt-8">
              <Button 
                onClick={() => setView('login')} 
                className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
              >
                Already registered? LOG IN
              </Button>
            </div>
          </Form>
        </div>

        {/* Form Container: Sign In (Right Side) */}
        <div className={`w-full md:w-1/2 md:absolute md:right-0 md:top-0 md:h-full p-8 md:p-20 flex flex-col justify-center transition-all duration-700 ${view !== 'login' ? 'hidden md:flex md:opacity-0 md:pointer-events-none' : 'flex opacity-100 z-10'}`}>
          <div className="mb-10">
            <Title level={2} className="!font-black !tracking-tighter !mb-2 !text-slate-900">Sign In</Title>
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">Access Student Portal</Text>
          </div>

          <Form layout="vertical" onFinish={handleLogin} className="space-y-4">
            <Form.Item name="nic" rules={[{ required: true, message: 'NIC is required' }]}>
              <Input 
                prefix={<Contact className="text-black mr-2" size={20} />} 
                placeholder="NIC Number" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password 
                prefix={<Lock className="text-black mr-2" size={20} />} 
                placeholder="Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <div className="flex justify-between items-center pt-2">
              <button 
                type="button" 
                onClick={() => setView('admin')}
                className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 transition-all"
              >
                <ShieldCheck size={14} /> Admin Access
              </button>
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 transition-all"
              >
                <KeyRound size={14} /> Forgot Password?
              </button>
            </div>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-16 bg-[#DC143C] hover:bg-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#DC143C]/20 mt-4 border-none"
            >
              Authenticate
            </Button>
            
            <div className="text-center pt-8 md:hidden border-t border-slate-100 mt-8">
              <div className="space-y-3">
                <Button 
                  onClick={() => setView('register')} 
                  className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
                >
                  No account? REGISTER
                </Button>
                <Button 
                  onClick={() => setView('admin')} 
                  variant="text"
                  className="w-full h-12 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]"
                >
                  Administrator Portal
                </Button>
              </div>
            </div>
          </Form>
        </div>

        {/* Form Container: Admin Login (Left Side) */}
        <div className={`w-full md:w-1/2 md:absolute md:left-0 md:top-0 md:h-full p-8 md:p-20 flex flex-col justify-center transition-all duration-700 ${view !== 'admin' ? 'hidden md:flex md:opacity-0 md:pointer-events-none' : 'flex opacity-100 z-10'}`}>
          <div className="mb-10">
            <Title level={2} className="!font-black !tracking-tighter !mb-2 !text-slate-900">Admin Login</Title>
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">Master Protocol Authentication</Text>
          </div>

          <Form layout="vertical" onFinish={handleAdminLogin} className="space-y-6">
            <Form.Item name="password" rules={[{ required: true, message: 'Administrative password required' }]}>
              <Input.Password 
                prefix={<Lock className="text-black mr-2" size={20} />} 
                placeholder="Administrative Master Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-16 bg-slate-900 hover:bg-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 mt-4 border-none"
            >
              Access Cloud Console
            </Button>

            <div className="text-center pt-8 border-t border-slate-100 mt-8">
              <Button 
                onClick={() => setView('login')} 
                className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
              >
                Back to STUDENT LOGIN
              </Button>
            </div>
          </Form>
        </div>

        {/* Form Container: Forgot Password (Left Side - reuse Register slot) */}
        <div className={`w-full md:w-1/2 md:absolute md:left-0 md:top-0 md:h-full p-8 md:p-20 flex flex-col justify-center transition-all duration-700 ${view !== 'forgot' ? 'hidden md:flex md:opacity-0 md:pointer-events-none' : 'flex opacity-100 z-10'}`}>
          <div className="mb-10">
            <Title level={2} className="!font-black !tracking-tighter !mb-2 !text-slate-900">Reset Password</Title>
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">Identify to recover account</Text>
          </div>

          <Form layout="vertical" onFinish={handleResetPassword} className="space-y-4">
            <Form.Item name="nic" rules={[{ required: true, message: 'NIC is required' }]}>
              <Input 
                prefix={<Contact className="text-black mr-2" size={20} />} 
                placeholder="Locked Account NIC" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item name="newPassword" rules={[{ required: true, message: 'New password required' }, { min: 6, message: 'Min 6 characters' }]}>
              <Input.Password 
                prefix={<Lock className="text-black mr-2" size={20} />} 
                placeholder="New System Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>
            <Form.Item 
              name="confirmPassword" 
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords mismatch'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<ShieldCheck className="text-black mr-2" size={20} />} 
                placeholder="Confirm New Password" 
                className="h-14 rounded-2xl !bg-white !text-black border-2 border-black px-6 font-black"
              />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-16 bg-[#DC143C] hover:bg-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#DC143C]/20 mt-4 border-none"
            >
              Reset Protocol
            </Button>

            <div className="text-center pt-8 border-t border-slate-100 mt-8">
              <Button 
                onClick={() => setView('login')} 
                className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
              >
                Back to LOG IN
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Terms and Conditions Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-[#DC143C]">
            <div className="p-2 bg-rose-50 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight leading-none">විශේෂ විනය පටිපාටිය</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Legal Protocols & Terms</div>
            </div>
          </div>
        }
        open={isTermsModalVisible}
        onCancel={() => setIsTermsModalVisible(false)}
        footer={null}
        centered
        width={600}
        styles={{ 
          mask: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(2, 6, 23, 0.4)' },
          body: { padding: '32px' }
        }}
        className="terms-modal rounded-[2.5rem] overflow-hidden"
      >
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <ShieldAlert size={80} />
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-bold text-lg leading-relaxed text-center leading-[1.8] relative z-10">
              මෙම පද්ධතිය තුළ පවතින අන්තර්ගතය අනවසරයෙන් බාගත කිරීමට හෝ අනවසරයෙන් බෙදා හැරීමක් සිදු කිරීම හෝ එවන් දේකට තැත් කිරීම හෝ අනුබලදීමක් ඔබ විසින් සිදු කළහොත් හෝ සිදු කිරීමට උත්සාහ කළහොත් එය මෙම පද්ධතිය හරහා දැනගත හැකි අතර, එවැනි ක්‍රියාවකට ඔබ වරදකරු බවට සනාථ වුවහොත් බුද්ධිමය දේපළ පනත යටතේ නීතිමය ක්‍රියාමාර්ග ගන්නා බවත්, පන්ති සඳහා ඇති සියලුම අවසරයන් අවලංගු වන බවත් කරුණාවෙන් සලකන්න..!
            </p>
          </div>
          
          <div className="flex items-center justify-center py-4">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Button 
              className="h-16 !bg-rose-600 hover:!bg-rose-700 !text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-rose-600/20 active:scale-95 transition-all border-none"
              onClick={() => {
                setIsTermsAccepted(false);
                setIsTermsModalVisible(false);
              }}
            >
              එකඟ නොවෙමි
            </Button>
            <Button 
              className="h-16 !bg-emerald-600 hover:!bg-emerald-700 !text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all border-none"
              onClick={() => {
                setIsTermsAccepted(true);
                setIsTermsModalVisible(false);
              }}
            >
              එකඟ වෙමි
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
