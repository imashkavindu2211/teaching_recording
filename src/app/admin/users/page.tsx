"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Modal, Spin, App, Table, Tag, Space, Tooltip } from 'antd';
import { SearchOutlined, EditOutlined, LockOutlined, UserOutlined, IdcardOutlined, ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import { Users, Search, RefreshCw, LogIn, Database, ChevronRight, UserCircle2, Fingerprint, Shield, Trash2 } from 'lucide-react';
import { Popconfirm } from 'antd';
import { supabase } from '@/lib/supabase';
import { normalizeNIC } from '@/lib/utils';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function AdminUsersPage() {
  return (
    <App>
      <AdminUsersContent />
    </App>
  );
}

function AdminUsersContent() {
  const { message } = App.useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Password Change Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [form] = Form.useForm();

  // Registration Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm] = Form.useForm();

  useEffect(() => {
    const adminSession = sessionStorage.getItem('admin_authenticated');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem('admin_authenticated', 'true');
      fetchStudents();
    }
  }, [isLoggedIn]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let allStudents: any[] = [];
      let from = 0;
      const step = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .range(from, from + step - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allStudents = [...allStudents, ...data];
        setStudents([...allStudents]); // Update state to show progress
        if (data.length < step) break;
        from += step;
      }

      setStudents(allStudents);
    } catch (err: any) {
      message.error('Failed to fetch student registry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'Admin@25258585') {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsLoggedIn(true);
      message.success('Secure session established');
    } else {
      message.error('Invalid credentials');
    }
  };

  const handleUpdatePassword = async (values: any) => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ password: values.newPassword })
        .eq('id', selectedStudent.id);

      if (error) throw error;
      
      message.success(`Password updated for ${selectedStudent.fullname}`);
      setIsModalOpen(false);
      form.resetFields();
      await fetchStudents();
    } catch (err: any) {
      message.error('Password update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openPasswordModal = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleRegisterStudent = async (values: any) => {
    setIsLoading(true);
    try {
      const normalizedNic = normalizeNIC(values.nic);
      
      // 1. Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('students')
        .select('nic')
        .or(`nic.eq.${normalizedNic},nic.eq.${normalizedNic}V,nic.eq.${normalizedNic}v`)
        .limit(1);

      if (checkError) throw new Error("Registry lookup failed.");
      if (existingUser && existingUser.length > 0) {
        message.error("A student with this NIC is already registered.");
        return;
      }

      // 2. Register user
      const { error: regError } = await supabase
        .from('students')
        .insert([{
          nic: normalizedNic,
          fullname: values.fullname,
          password: values.password
        }]);

      if (regError) throw regError;

      message.success(`Student ${values.fullname} registered successfully!`);
      setIsRegModalOpen(false);
      regForm.resetFields();
      await fetchStudents();
    } catch (err: any) {
      message.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (student: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      message.success(`Student ${student.fullname} has been removed from registry`);
      await fetchStudents();
    } catch (err: any) {
      message.error('Failed to remove student');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.fullname?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.nic && normalizeNIC(s.nic).includes(normalizeNIC(searchQuery)))
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md shadow-2xl border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-6">
          <div className="text-center mb-10 pt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#DC143C] to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-all">
              <Shield className="text-white" size={40} />
            </div>
            <Title level={2} className="!text-slate-900 dark:!text-white !font-black !tracking-tighter">Identity Management</Title>
            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Administrative Protocol Required</Text>
          </div>
          <Input.Password
            size="large"
            placeholder="System Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onPressEnter={handleAdminLogin}
            className="rounded-2xl h-14 !bg-white !text-black border-2 border-black font-black placeholder:!text-slate-400"
          />
          <Button type="primary" size="large" block onClick={handleAdminLogin} className="mt-8 h-14 bg-slate-900 hover:bg-black border-none rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-black/20">
            Authenticate
          </Button>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</span>,
      key: 'identity',
      sorter: (a: any, b: any) => a.fullname.localeCompare(b.fullname),
      render: (record: any) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#DC143C] transition-colors overflow-hidden">
            <UserCircle2 size={24} />
          </div>
          <div className="flex flex-col">
            <Text className="font-black dark:text-white text-lg tracking-tight leading-none mb-1">{record.fullname}</Text>
            <div className="flex items-center gap-2">
              <Fingerprint size={12} className="text-slate-400" />
              <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">ID: {record.id.slice(0, 8)}...</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIC (ID NUMBER)</span>,
      dataIndex: 'nic',
      key: 'nic',
      sorter: (a: any, b: any) => a.nic.localeCompare(b.nic),
      render: (nic: string) => (
        <div className="flex items-center gap-3">
          <Tag className="px-5 py-2 bg-rose-500/10 text-rose-600 rounded-xl font-black tracking-[0.1em] text-sm border border-rose-500/20 m-0">
            {nic}
          </Tag>
          <Tooltip title="Copy Identity">
             <Button 
               type="text" 
               icon={<IdcardOutlined />} 
               className="text-slate-300 hover:text-[#DC143C]"
               onClick={() => {
                 navigator.clipboard.writeText(nic);
                 message.success('ID Copied to clipboard');
               }}
             />
          </Tooltip>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stored Password</span>,
      dataIndex: 'password',
      key: 'password',
      render: (password: string) => (
        <div className="flex items-center gap-2">
          <KeyOutlined className="text-slate-400" />
          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
            {password}
          </span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Controls</span>,
      key: 'action',
      align: 'right' as const,
      width: 320,
      render: (record: any) => (
        <Space size="middle" className="w-full justify-end">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => openPasswordModal(record)}
            className="h-12 px-6 rounded-2xl font-black bg-[#DC143C] border-none shadow-xl shadow-rose-600/20 hover:bg-rose-600 transition-all flex items-center gap-2"
          >
            OVERRIDE
          </Button>
          <Popconfirm
            title="Terminate Student Account?"
            description="This action is permanent and cannot be undone."
            onConfirm={() => handleDeleteStudent(record)}
            okText="YES, DELETE"
            cancelText="CANCEL"
            okButtonProps={{ 
              danger: true, 
              className: "bg-rose-600 font-black h-10 rounded-xl uppercase text-[10px] tracking-widest" 
            }}
            cancelButtonProps={{ 
              className: "font-black h-10 rounded-xl uppercase text-[10px] tracking-widest" 
            }}
          >
            <Button 
              danger 
              icon={<Trash2 size={18} />} 
              className="h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 transition-all"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen py-12 pb-24 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl relative overflow-hidden">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-[#DC143C] animate-pulse z-50" />
          )}
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <Button 
                icon={<ArrowLeftOutlined />} 
                className="w-14 h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all bg-white/20"
              />
            </Link>
            <div className="w-16 h-16 bg-[#DC143C] rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/30">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <Title level={1} className="!m-0 !text-4xl !font-black !tracking-tighter dark:!text-white">User Registry</Title>
              <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 block">Identity & Access Control</Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex flex-col items-end">
               <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</Text>
               <div className="px-6 py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-sm tracking-tight border border-emerald-500/20">
                 {students.length} STUDENTS
               </div>
             </div>
             <Button 
               type="primary" 
               icon={<UserOutlined />} 
               size="large"
               onClick={() => setIsRegModalOpen(true)}
               className="h-16 px-10 rounded-[1.5rem] bg-[#DC143C] border-none font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-rose-600/20 hover:bg-rose-600 transition-all flex items-center gap-3"
             >
               Register Student
             </Button>
          </div>
        </div>

        {/* Search & Actions */}
        <Card className="mb-8 shadow-2xl border-white/20 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 p-8 items-center">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <Input 
                placeholder="Search by Name, NIC, or Identity Number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-20 pl-16 pr-8 rounded-[2rem] !bg-white dark:!bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-xl placeholder:text-slate-300 transition-all focus:border-[#DC143C]/30 shadow-sm"
              />
            </div>
            <Button 
              size="large" 
              icon={<RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />} 
              onClick={fetchStudents}
              className="h-20 px-10 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white"
            >
              SYNC
            </Button>
          </div>

          <div className="p-2 pt-0">
            <Table 
              dataSource={filteredStudents} 
              columns={columns} 
              rowKey="id"
              loading={isLoading}
              pagination={{ 
                pageSize: 10,
                className: "px-8 py-4 font-black",
                showSizeChanger: false 
              }}
              className="user-registry-table"
              rowClassName="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
            />
          </div>
        </Card>

        {/* System Info Banner */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t-4 border-[#DC143C] shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Database className="text-[#DC143C]" size={28} />
            </div>
            <div>
              <Title level={4} className="!text-white !m-0 !font-black !tracking-tight">Global Student Directory</Title>
              <Text className="text-slate-400 font-medium">All student data is encrypted and synced with the central cloud repository.</Text>
            </div>
          </div>
          <Button 
            href="/admin" 
            className="h-14 px-10 rounded-2xl bg-[#DC143C] text-white border-none font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-600 transition-all flex items-center gap-3"
          >
            <span>MASTER CONSOLE</span>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        title={
          <div className="flex items-center gap-4 text-slate-900 pt-2">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#DC143C]">
              <LockOutlined className="text-2xl" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tighter leading-none">Security Override</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Manual Password Update</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={500}
        className="security-modal"
        styles={{ 
          mask: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(2, 6, 23, 0.4)' },
          body: { padding: '32px' }
        }}
      >
        {selectedStudent && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 flex flex-col items-center justify-center text-center shadow-2xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#DC143C]" />
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.25em] mb-4 block" style={{ color: '#94a3b8' }}>
                Master Registry Verification
              </span>
              <span className="font-black text-4xl tracking-tighter text-black block mb-6 leading-tight" style={{ color: '#000' }}>
                {selectedStudent.fullname}
              </span>
              <div className="flex flex-col items-center gap-3">
                 <span className="px-8 py-3 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black text-lg tracking-widest border-2 border-rose-100/50 shadow-sm" style={{ color: '#DC143C' }}>
                   {selectedStudent.nic}
                 </span>
                 <div className="flex items-center gap-2 opacity-40">
                    <Fingerprint size={12} className="text-black" />
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest">Global Identity Check</span>
                 </div>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item 
                name="newPassword" 
                label={
                  <div className="flex items-center gap-2 mb-1">
                    <KeyOutlined className="text-rose-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Authorized System Access Key</span>
                  </div>
                }
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 6, message: 'Minimum security length: 6 characters' }
                ]}
              >
                <Input.Password className="h-14 rounded-2xl border-2 border-slate-100 font-black px-6 hover:border-[#DC143C]/20 transition-all !bg-white !text-slate-900" />
              </Form.Item>
              
              <div className="grid grid-cols-2 gap-4 mt-10">
                <Button 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-14 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest bg-white hover:bg-slate-50 transition-all"
                >
                  ABORT OVERRIDE
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading}
                  className="h-14 rounded-2xl bg-[#DC143C] border-none font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-600 transition-all"
                >
                  DEACTIVATE & UPDATE
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Registration Modal */}
      <Modal
        title={
          <div className="flex items-center gap-4 text-slate-900 pt-2">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-[#DC143C]">
              <UserOutlined className="text-2xl" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tighter leading-none">New Student Enrollment</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Manual Master Registry</div>
            </div>
          </div>
        }
        open={isRegModalOpen}
        onCancel={() => setIsRegModalOpen(false)}
        footer={null}
        centered
        width={550}
        className="security-modal"
        styles={{ 
          mask: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(2, 6, 23, 0.4)' },
          body: { padding: '32px' }
        }}
      >
        <Form form={regForm} layout="vertical" onFinish={handleRegisterStudent} className="space-y-6">
          <Form.Item name="fullname" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Full Name</span>} rules={[{ required: true }]}>
            <Input prefix={<UserOutlined className="text-slate-400 mr-2" />} placeholder="Student's Legal Name" className="h-14 rounded-2xl border-2 border-slate-100 font-bold px-6 !bg-white !text-slate-900" />
          </Form.Item>
          <Form.Item 
            name="nic" 
            label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-200">National ID (NIC)</span>} 
            getValueFromEvent={(e) => e.target.value.replace(/[^0-9Vv]/g, '')}
            rules={[
              { required: true, message: 'NIC is required' },
              { pattern: /^[0-9Vv]*$/i, message: 'Only numbers and the letter V are allowed' }
            ]}
          >
            <Input 
              prefix={<IdcardOutlined className="text-slate-400 mr-2" />} 
              placeholder="Identification Number" 
              className="h-14 rounded-2xl border-2 border-slate-100 font-bold px-6 !bg-white !text-slate-900 uppercase" 
            />
          </Form.Item>
          <Form.Item name="password" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Account Password</span>} rules={[{ required: true }, { min: 6 }]}>
            <Input.Password prefix={<LockOutlined className="text-slate-400 mr-2" />} placeholder="Create Secure Password" className="h-14 rounded-2xl border-2 border-slate-100 font-bold px-6 !bg-white !text-slate-900" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4 mt-10">
            <Button 
              onClick={() => setIsRegModalOpen(false)} 
              className="h-14 rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest bg-white hover:bg-slate-50 transition-all"
            >
              CANCEL
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              className="h-14 rounded-2xl bg-[#DC143C] border-none font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-600 transition-all"
            >
              ENROLL STUDENT
            </Button>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        .user-registry-table .ant-table {
          background: transparent !important;
        }
        .user-registry-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 2px solid rgba(0,0,0,0.05) !important;
        }
        .user-registry-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(0,0,0,0.03) !important;
          padding: 24px !important;
        }
        .user-registry-table .ant-pagination-item-active {
          border-color: #DC143C !important;
          background: #DC143C !important;
        }
        .user-registry-table .ant-pagination-item-active a {
          color: white !important;
        }
        .security-modal .ant-modal-content {
          background-color: #0f172a !important; /* Force dark background */
          border-radius: 2.5rem !important;
          overflow: hidden !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5) !important;
        }
        .security-modal .ant-modal-header {
          background-color: transparent !important;
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
        .security-modal .ant-modal-title {
          color: white !important;
        }
        .security-modal .ant-modal-close {
          color: rgba(255,255,255,0.4) !important;
        }
      `}</style>
    </div>
  );
}
