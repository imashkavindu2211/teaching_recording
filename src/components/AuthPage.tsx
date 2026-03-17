"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message as staticMessage, Card, App } from 'antd';
import { User, Lock, Contact, ShieldCheck, ArrowRight, UserPlus, LogIn, KeyRound, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Registration Logic
  const handleRegister = async (values: any) => {
    setLoading(true);
    try {

      // 2. Check if user already exists
      const { data: existingUser } = await supabase
        .from('students')
        .select('nic')
        .eq('nic', values.nic)
        .single();

      if (existingUser) {
        message.error("A student with this NIC is already registered.");
        return;
      }

      // 3. Register user
      const { error: regError } = await supabase
        .from('students')
        .insert([{
          nic: values.nic,
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
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('nic', values.nic)
        .eq('password', values.password)
        .single();

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
      // 1. Check if user exists
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('nic', values.nic)
        .single();

      if (fetchError || !student) {
        message.error("No student found with this NIC.");
        return;
      }

      // 2. Update password
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: values.newPassword })
        .eq('nic', values.nic);

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

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col">
      {/* Top Accent Line */}
      <div className="h-1 w-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] z-50"></div>

      {/* Header Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('login')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all duration-300 ${
              view === 'login' 
                ? 'bg-[#DC143C] text-white shadow-lg shadow-[#DC143C]/30' 
                : 'bg-rose-50 text-[#DC143C] hover:bg-rose-100'
            }`}
          >
            Log In
          </button>
          <button 
            onClick={() => setView('register')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all duration-300 ${
              view === 'register' 
                ? 'bg-[#DC143C] text-white shadow-lg shadow-[#DC143C]/30' 
                : 'bg-rose-50 text-[#DC143C] hover:bg-rose-100'
            }`}
          >
            Register Student
          </button>
        </div>
        
        {/* Decorative Academy Brand */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#DC143C] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={18} />
          </div>
          <span className="font-black text-slate-800 tracking-tighter uppercase text-sm">Academy Portal</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row min-h-[650px] relative">
        
        
        {/* Toggleable Panel (Decorative) */}
        <div 
          className={`hidden md:flex absolute top-0 w-1/2 h-full bg-gradient-to-br from-[#DC143C] to-rose-700 transition-all duration-700 ease-in-out z-20 items-center justify-center p-12 text-white
            ${(view === 'register' || view === 'forgot') ? 'left-1/2 rounded-l-[5rem]' : 'left-0 rounded-r-[5rem]'}
          `}
        >
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              {view === 'register' ? <UserPlus size={40} /> : view === 'forgot' ? <RefreshCw size={40} /> : <LogIn size={40} />}
            </div>
            <Title level={1} className="!text-white !font-black !m-0 !tracking-tighter">
              {view === 'register' ? "Join the Academy" : view === 'forgot' ? "Security Recovery" : "Welcome Back"}
            </Title>
            <p className="text-rose-50 font-medium text-lg leading-relaxed">
              {view === 'register' 
                ? "Enter your details to access the premium lesson repository and start your learning journey." 
                : view === 'forgot'
                ? "Enter your NIC and choose a new secure password to regain access to your dashboard."
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

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-16 bg-[#DC143C] hover:bg-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#DC143C]/20 mt-4 border-none"
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
            <div className="flex justify-end pt-2">
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
              <Button 
                onClick={() => setView('register')} 
                className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
              >
                No account? REGISTER
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
</div>
  );
}
