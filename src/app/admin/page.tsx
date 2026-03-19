"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, Divider, Card, Typography, Modal, message as staticMessage, Select, Spin, App } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { LogIn, Database, Edit3, LogOut, Calendar, Save, RefreshCw, IdCard, Search, UserCheck } from 'lucide-react';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase';
import { normalizeNIC } from '@/lib/utils';

const { Title, Text } = Typography;

interface PdfFile {
  name: string;
  googleDriveFileId: string;
}

interface ClassEntry {
  id: string;
  monthId: string;
  date: string;
  topic: string;
  youtubeUrl: string;
  pdfFiles: PdfFile[];
}

interface Month {
  id: string;
  name: string;
  access_code?: string;
}

export default function AdminPage() {
  return (
    <App>
      <AdminContent />
    </App>
  );
}

function AdminContent() {
  const { message } = App.useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [months, setMonths] = useState<Month[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  
  const [editingClass, setEditingClass] = useState<ClassEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [monthForm] = Form.useForm();

  // Search State
  const [searchNic, setSearchNic] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleNicSearch = async () => {
    if (!searchNic.trim()) return;
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const normalized = normalizeNIC(searchNic);
      const { data, error } = await supabase
        .from('students')
        .select('fullname, nic')
        .or(`nic.eq.${normalized},nic.eq.${normalized}V,nic.eq.${normalized}v`);
      
      if (error) throw error;
      setSearchResults(data || []);
      if (data && data.length > 0) {
        message.success(`Found ${data.length} matching record(s)`);
      }
    } catch (err) {
      message.error('Identity lookup failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNameSearch = async () => {
    if (!searchName.trim()) return;
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('fullname, nic')
        .ilike('fullname', `%${searchName}%`);
      
      if (error) throw error;
      setSearchResults(data || []);
      if (data && data.length > 0) {
        message.success(`Found ${data.length} matching student(s)`);
      }
    } catch (err) {
      message.error('Student search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: monthsData } = await supabase.from('months').select('*').order('id', { ascending: false });
      const { data: classesData } = await supabase.from('classes').select('*, pdf_files(*)').order('date', { ascending: false });

      if (monthsData) setMonths(monthsData);
      if (classesData) {
        const transformed = classesData.map(c => ({
          id: c.id,
          monthId: c.month_id,
          date: c.date,
          topic: c.topic,
          youtubeUrl: c.youtube_url,
          pdfFiles: c.pdf_files.map((p: any) => ({
            name: p.name,
            googleDriveFileId: p.google_drive_file_id
          }))
        }));
        setClasses(transformed);
      }
    } catch (error) {
      message.error('Failed to connect to database');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomArray = new Uint32Array(6);
    window.crypto.getRandomValues(randomArray);
    
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(randomArray[i] % chars.length);
    }
    return code;
  };

  const handleLogin = () => {
    if (password === 'Admin@25258585') {
      setIsLoggedIn(true);
      message.success('Secure session established');
    } else {
      message.error('Invalid credentials');
    }
  };

  const onAddMonth = async (values: any) => {
    setIsLoading(true);
    const accessCode = generateAccessCode();
    console.log('Registering month with code:', accessCode);
    
    try {
      const { data, error } = await supabase
        .from('months')
        .insert([
          { 
            id: values.id, 
            name: values.name, 
            access_code: accessCode 
          }
        ])
        .select();

      if (error) {
        console.error('Database Error:', error);
        throw new Error(error.message);
      }
      
      message.success(`Month registry updated. Access Code: ${accessCode}`);
      monthForm.resetFields();
      await fetchData();
    } catch (error: any) {
      console.error('Submission Error:', error);
      message.error(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMonth = async (id: string) => {
    let enteredPassword = '';
    Modal.confirm({
      title: 'Purge Month Category?',
      content: (
        <div className="pt-4">
          <p className="mb-4 text-slate-500 font-bold text-xs uppercase tracking-widest text-red-600">Warning: This is a destructive action.</p>
          <Input.Password 
            placeholder="Enter Admin Password to confirm" 
            onChange={(e) => enteredPassword = e.target.value}
            className="rounded-xl h-12 border-2 border-slate-200"
          />
        </div>
      ),
      okText: 'Purge Category',
      okType: 'danger',
      onOk: async () => {
        if (enteredPassword !== 'Admin@25258585') {
          message.error('Invalid admin password. Operation declined.');
          return Promise.reject();
        }
        setIsLoading(true);
        try {
          const { error } = await supabase.from('months').delete().eq('id', id);
          if (error) throw error;
          message.success('Month purged from registry');
          fetchData();
        } catch (error: any) {
          message.error('Cannot delete month with active recordings');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const resetAccessCode = async (id: string) => {
    let enteredPassword = '';
    Modal.confirm({
      title: 'Reset Access Code?',
      content: (
        <div className="pt-4">
          <p className="mb-4 text-slate-500 font-bold text-xs uppercase tracking-widest text-[#DC143C]">New code will be generated immediately.</p>
          <Input.Password 
            placeholder="Enter Admin Password to confirm" 
            onChange={(e) => enteredPassword = e.target.value}
            className="rounded-xl h-12 border-2 border-slate-200"
          />
        </div>
      ),
      okText: 'Generate New Code',
      okType: 'primary',
      onOk: async () => {
        if (enteredPassword !== 'Admin@25258585') {
          message.error('Invalid admin password. Operation declined.');
          return Promise.reject();
        }
        
        setIsLoading(true);
        const newCode = generateAccessCode();
        try {
          const { error } = await supabase
            .from('months')
            .update({ access_code: newCode })
            .eq('id', id);

          if (error) throw error;
          message.success(`New code established: ${newCode}`);
          fetchData();
        } catch (error: any) {
          message.error('Failed to reset access code');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const onFinishAdd = async (values: any) => {
    setIsLoading(true);
    const classId = Date.now().toString();
    try {
      // 1. Insert Class
      const { error: classError } = await supabase.from('classes').insert([
        {
          id: classId,
          month_id: values.monthId,
          date: values.date.format('YYYY-MM-DD'),
          topic: values.topic,
          youtube_url: values.youtubeUrl
        }
      ]);

      if (classError) throw classError;

      // 2. Insert PDFs if any
      if (values.pdfFiles && values.pdfFiles.length > 0) {
        const pdfData = values.pdfFiles.map((p: any) => ({
          class_id: classId,
          name: p.name,
          google_drive_file_id: p.googleDriveFileId
        }));
        const { error: pdfError } = await supabase.from('pdf_files').insert(pdfData);
        if (pdfError) throw pdfError;
      }

      message.success('Academic session deployed to cloud');
      form.resetFields(['date', 'topic', 'youtubeUrl', 'pdfFiles']);
      fetchData();
    } catch (error: any) {
      message.error(`Deployment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onFinishEdit = async (values: any) => {
    if (!editingClass) return;
    setIsLoading(true);
    try {
      // 1. Update Class
      const { error: classError } = await supabase.from('classes').update({
        month_id: values.monthId,
        date: values.date.format('YYYY-MM-DD'),
        topic: values.topic,
        youtube_url: values.youtubeUrl
      }).eq('id', editingClass.id);

      if (classError) throw classError;

      // 2. Refresh PDFs (Delete old, insert new)
      await supabase.from('pdf_files').delete().eq('class_id', editingClass.id);
      
      if (values.pdfFiles && values.pdfFiles.length > 0) {
        const pdfData = values.pdfFiles.map((p: any) => ({
          class_id: editingClass.id,
          name: p.name,
          google_drive_file_id: p.googleDriveFileId
        }));
        await supabase.from('pdf_files').insert(pdfData);
      }

      message.success('Registry record updated');
      setIsEditModalOpen(false);
      setEditingClass(null);
      fetchData();
    } catch (error: any) {
      message.error(`Update failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    let enteredPassword = '';
    Modal.confirm({
      title: 'Purge Recording?',
      content: (
        <div className="pt-4">
          <p className="mb-4 text-slate-500 font-bold text-xs uppercase tracking-widest">Secure Verification Required</p>
          <Input.Password 
            placeholder="Enter Admin Password to confirm" 
            onChange={(e) => enteredPassword = e.target.value}
            className="rounded-xl h-12 border-2 border-slate-200"
          />
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        if (enteredPassword !== 'Admin@25258585') {
          message.error('Invalid admin password. Operation declined.');
          return Promise.reject();
        }
        setIsLoading(true);
        try {
          const { error } = await supabase.from('classes').delete().eq('id', id);
          if (error) throw error;
          message.success('Record purged');
          fetchData();
        } catch (error: any) {
          message.error('Purge operation failed');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const openEditModal = (classItem: ClassEntry) => {
    setEditingClass(classItem);
    editForm.setFieldsValue({
      monthId: classItem.monthId,
      topic: classItem.topic,
      date: dayjs(classItem.date),
      youtubeUrl: classItem.youtubeUrl,
      pdfFiles: classItem.pdfFiles,
    });
    setIsEditModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl border-white/20 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4">
          <div className="text-center mb-10 pt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-all">
              <LogIn className="text-white" size={32} />
            </div>
            <Title level={2} className="!text-slate-900 dark:!text-white !font-black !tracking-tighter">Central Access</Title>
            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Cloud Database Protocol</Text>
          </div>
          <Input.Password
            size="large"
            placeholder="System Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            className="rounded-2xl h-14 !bg-white !text-black border-2 border-black font-black placeholder:!text-black placeholder:!opacity-100"
          />
          <Button type="primary" size="large" block onClick={handleLogin} className="mt-8 h-14 bg-red-600 rounded-2xl font-black">
            Authenticate
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-sm relative overflow-hidden">
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse z-50" />
          )}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Database className="text-white" size={32} />
            </div>
            <div>
              <Title level={1} className="!m-0 !text-4xl !font-black !tracking-tighter dark:!text-white">Cloud Console</Title>
              <Text className="text-slate-500 font-bold text-sm">Supabase Real-time Management Access</Text>
            </div>
          </div>
          <Button href="/" className="h-12 px-8 rounded-2xl border-white/20 font-black text-xs uppercase tracking-widest bg-white/10 backdrop-blur-md">
            Go to Portal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Month Management */}
          <Card className="shadow-2xl border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4 md:p-12">
            <Title level={3} className="!font-black !tracking-tighter !mb-8 dark:!text-white flex items-center gap-3">
              <Calendar className="text-red-600" size={24} /> Month Registry
            </Title>
            <Form form={monthForm} layout="vertical" onFinish={onAddMonth}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Form.Item name="id" label={<span className="text-[10px] font-black uppercase text-slate-400">ID (YYYY-MM)</span>} rules={[{ required: true }]}>
                  <Input placeholder="2024-05" className="h-12 rounded-xl" />
                </Form.Item>
                <Form.Item name="name" label={<span className="text-[10px] font-black uppercase text-slate-400">Display (Month YYYY)</span>} rules={[{ required: true }]}>
                  <Input placeholder="May 2024" className="h-12 rounded-xl" />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" block loading={isLoading} className="h-12 bg-red-600 rounded-xl font-black">Register Month</Button>
            </Form>

            <div className="mt-8 space-y-3">
              {months.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/20 rounded-2xl border border-white/5 group/month">
                  <div className="flex flex-col">
                    <Text className="font-black dark:text-white text-lg tracking-tight">{m.name}</Text>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-[11px] font-black text-emerald-500 tracking-[0.2em] uppercase">
                          {m.access_code || 'NO CODE'}
                        </span>
                      </div>
                      {m.access_code && (
                        <>
                          <button 
                            className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 font-bold text-[10px] uppercase tracking-widest transition-all"
                            onClick={() => {
                              navigator.clipboard.writeText(m.access_code!);
                              message.success(`Copied: ${m.access_code}`);
                            }}
                          >
                            <CopyOutlined size={14} />
                            <span>Copy</span>
                          </button>
                          <button 
                            className="flex items-center gap-1.5 text-slate-400 hover:text-[#DC143C] font-bold text-[10px] uppercase tracking-widest transition-all ml-2"
                            onClick={() => resetAccessCode(m.id)}
                          >
                            <RefreshCw size={14} />
                            <span>Reset</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => deleteMonth(m.id)} 
                    loading={isLoading}
                    className="opacity-0 group-hover/month:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* New Recording Form */}
          <Card className="shadow-2xl border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4 md:p-12">
            <Title level={3} className="!font-black !tracking-tighter !mb-8 dark:!text-white flex items-center gap-3">
              <PlusOutlined className="text-red-600" /> New Deployment
            </Title>
            <Form form={form} layout="vertical" onFinish={onFinishAdd} initialValues={{ date: dayjs() }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item name="monthId" label={<span className="font-black text-[11px] uppercase text-slate-400">Target Month</span>} rules={[{ required: true }]}>
                  <Select size="large" className="h-12 rounded-xl" placeholder="Select Registry Month">
                    {months.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="date" label={<span className="font-black text-[11px] uppercase text-slate-400">Session Date</span>} rules={[{ required: true }]}>
                  <DatePicker className="w-full h-12 rounded-xl" format="YYYY-MM-DD" />
                </Form.Item>
              </div>
              <Form.Item name="youtubeUrl" label={<span className="font-black text-[11px] uppercase text-slate-400">YouTube Cloud Link</span>} rules={[{ required: true }]}>
                <Input className="h-12 rounded-xl" placeholder="https://..." />
              </Form.Item>
              <Form.Item name="topic" label={<span className="font-black text-[11px] uppercase text-slate-400">Academic Topic</span>} rules={[{ required: true }]}>
                <Input className="h-14 rounded-xl font-black text-lg" placeholder="e.g. Logic Systems" />
              </Form.Item>

              <Divider className="!my-8" />
              
              <Form.List name="pdfFiles">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="bg-white/30 dark:bg-slate-800/20 p-6 rounded-2xl border border-white/5 flex gap-4 items-end">
                        <Form.Item {...restField} name={[name, 'name']} className="flex-grow mb-0" label={<span className="text-[10px] uppercase font-black">Title</span>}>
                          <Input className="h-10 rounded-lg" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'googleDriveFileId']} className="flex-grow mb-0" label={<span className="text-[10px] uppercase font-black">Drive ID / Link</span>}>
                          <Input className="h-10 rounded-lg" />
                        </Form.Item>
                        <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="h-12 rounded-xl">Add Study Material</Button>
                  </div>
                )}
              </Form.List>

              <Button type="primary" htmlType="submit" block loading={isLoading} size="large" className="h-16 bg-red-600 rounded-2xl font-black uppercase text-xs tracking-widest mt-8 shadow-xl shadow-red-500/20">
                Deploy to Cloud Storage
              </Button>
            </Form>
          </Card>
        </div>

        {/* Identity Directory Search */}
        <Card className="mt-12 shadow-2xl border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4 md:p-12">
          <Title level={3} className="!font-black !tracking-tighter !mb-8 dark:!text-white flex items-center gap-3">
            <IdCard className="text-red-600" size={24} /> Identity Registry Search
          </Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Text className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Lookup by Identity Number (NIC)</Text>
              <div className="flex gap-4">
                <Input 
                  placeholder="Enter NIC Number (e.g. 19980123...)" 
                  className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/40 font-black px-6"
                  value={searchNic}
                  onChange={(e) => setSearchNic(e.target.value)}
                  onPressEnter={handleNicSearch}
                />
                <Button 
                  type="primary" 
                  className="h-14 bg-slate-900 hover:bg-black rounded-2xl font-black px-8 flex items-center gap-2"
                  onClick={handleNicSearch}
                  loading={isSearching}
                >
                  <Search size={18} />
                  <span>SECURE LOOKUP</span>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Text className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Lookup by Student Name</Text>
              <div className="flex gap-4">
                <Input 
                  placeholder="Enter full or partial name" 
                  className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/40 font-black px-6"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onPressEnter={handleNameSearch}
                />
                <Button 
                  type="primary" 
                  className="h-14 bg-slate-900 hover:bg-black rounded-2xl font-black px-8 flex items-center gap-2"
                  onClick={handleNameSearch}
                  loading={isSearching}
                >
                  <UserCheck size={18} />
                  <span>FIND ACCOUNT</span>
                </Button>
              </div>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/5 dark:bg-slate-800/60">
                      <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Registered Student Name</th>
                      <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">National Identity (NIC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {searchResults.map((student, idx) => (
                      <tr key={idx} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-6 font-black dark:text-white capitalize text-lg">{student.fullname}</td>
                        <td className="p-6">
                           <span className="px-5 py-2 bg-rose-500/10 text-red-600 rounded-xl font-black tracking-[0.1em] text-md border border-rose-500/20">
                             {student.nic}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {searchPerformed && searchResults.length === 0 && !isSearching && (
            <div className="mt-10 p-10 bg-rose-500/5 rounded-[2rem] border-2 border-dashed border-rose-500/10 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#DC143C]">
                <Search size={28} />
              </div>
              <Text className="block font-black text-[#DC143C] uppercase text-xs tracking-[0.2em]">Access Denied: Record Not Found</Text>
              <Text className="block text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">The requested identity protocol does not exist in the secure database</Text>
            </div>
          )}
        </Card>

        {/* List Section */}
        <Card className="mt-12 shadow-2xl border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-4 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <Title level={3} className="!font-black !tracking-tighter !m-0 dark:!text-white">Active Registry</Title>
            <Select defaultValue="show-all" className="w-full md:w-64 h-12" onChange={setFilterMonth}>
              <Select.Option value="show-all">View All Sessions</Select.Option>
              {months.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)}
            </Select>
          </div>

          {isLoading && classes.length === 0 ? (
            <div className="py-20 text-center"><Spin size="large" /></div>
          ) : (
            <div className="space-y-4">
              {classes.filter(c => filterMonth === 'show-all' || c.monthId === filterMonth).map((item) => (
                <div key={item.id} className="bg-white/40 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-white dark:hover:bg-slate-800 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                      <Database size={20} />
                    </div>
                    <div>
                      <Text className="block font-black dark:text-white text-lg tracking-tight">{item.topic}</Text>
                      <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">{item.date}</Text>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button icon={<EditOutlined />} onClick={() => openEditModal(item)} className="rounded-xl font-bold h-12 px-6">Edit</Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteClass(item.id)} className="rounded-xl font-bold h-12 px-6">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        title={<span className="text-xl font-black">Sync Protocol Adjustments</span>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={800}
        centered
        className="glass-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={onFinishEdit} className="space-y-6 p-4">
          <div className="grid grid-cols-2 gap-6">
            <Form.Item name="monthId" label={<span className="font-black text-[11px] uppercase text-slate-400">Registry Month</span>} rules={[{ required: true }]}>
              <Select size="large" className="h-12 rounded-xl">
                {months.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="date" label={<span className="font-black text-[11px] uppercase text-slate-400">Session Date</span>} rules={[{ required: true }]}>
              <DatePicker className="w-full h-12 rounded-xl" format="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <Form.Item name="youtubeUrl" label={<span className="font-black text-[11px] uppercase text-slate-400">Video Link</span>} rules={[{ required: true }]}>
            <Input className="h-12 rounded-xl" />
          </Form.Item>
          <Form.Item name="topic" label={<span className="font-black text-[11px] uppercase text-slate-400">Topic</span>} rules={[{ required: true }]}>
            <Input className="h-12 rounded-xl font-bold" />
          </Form.Item>

          <Form.List name="pdfFiles">
             {(fields, { add, remove }) => (
               <div className="space-y-4">
                 {fields.map(({ key, name, ...restField }) => (
                   <div key={key} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl flex gap-4 items-end">
                     <Form.Item {...restField} name={[name, 'name']} className="flex-grow mb-0" label="File Title">
                       <Input className="h-10" />
                     </Form.Item>
                     <Form.Item {...restField} name={[name, 'googleDriveFileId']} className="flex-grow mb-0" label="Drive ID">
                       <Input className="h-10" />
                     </Form.Item>
                     <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                   </div>
                 ))}
                 <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Resource</Button>
               </div>
             )}
           </Form.List>

          <div className="mt-10 flex gap-4">
            <Button onClick={() => setIsEditModalOpen(false)} block className="h-14 rounded-2xl font-black">Cancel</Button>
            <Button type="primary" htmlType="submit" block loading={isLoading} className="h-14 bg-red-600 rounded-2xl font-black shadow-xl shadow-red-500/20 shadow-none border-none">
              Deploy Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
