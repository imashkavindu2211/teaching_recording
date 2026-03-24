"use client";

import React from 'react';
import { Card, Button, Dropdown, MenuProps } from 'antd';
import { PlayCircle, Download, FileText, Calendar, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PdfFile {
  name: string;
  googleDriveFileId: string;
}

interface ClassEntry {
  id: string;
  date: string;
  topic: string;
  youtubeUrl: string;
  pdfFiles: PdfFile[];
}

interface ClassCardProps {
  classData: ClassEntry;
}

const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const getDownloadUrl = (fileId: string) => {
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };

  const pdfMenuItems: MenuProps['items'] = classData.pdfFiles.map((pdf, index) => ({
    key: index.toString(),
    label: (
      <a
        href={getDownloadUrl(pdf.googleDriveFileId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 py-1 px-1"
      >
        <FileText size={16} className="text-[#DC143C]" />
        <span className="font-medium text-slate-700 dark:text-slate-300">{pdf.name}</span>
      </a>
    ),
  }));

  return (
    <Card
      className="overflow-hidden border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-900/60 hover:border-rose-200 dark:hover:border-rose-900 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-50/50 dark:hover:shadow-rose-900/10 group rounded-3xl"
      styles={{ body: { padding: '2rem' } }}
    >
      <div className="flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl text-[#DC143C] dark:text-rose-400 group-hover:bg-[#DC143C] group-hover:text-white transition-all duration-500 shadow-sm">
            <Youtube size={28} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
            <Calendar size={12} strokeWidth={3} />
            {classData.date}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#DC143C] dark:group-hover:text-rose-400 transition-colors duration-300">
            {classData.topic}
          </h3>
        </div>

        <div className="mt-auto pt-6 flex flex-wrap gap-3">
          <Button
            type="primary"
            icon={<PlayCircle size={20} />}
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.push(`/watch/${classData.id}`);
            }}
            className="flex-1 items-center justify-center gap-2 h-12 px-6 font-bold shadow-lg shadow-rose-100 dark:shadow-rose-950/20 bg-[#DC143C] hover:bg-rose-700 active:scale-95 transition-all rounded-xl border-none"
          >
            Watch Video
          </Button>

          {classData.pdfFiles.length === 1 ? (
            <Button
              icon={<Download size={20} />}
              href={getDownloadUrl(classData.pdfFiles[0].googleDriveFileId)}
              target="_blank"
              className="flex items-center gap-2 h-12 px-6 font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#DC143C] dark:hover:text-rose-400 hover:border-[#DC143C] dark:hover:border-rose-900 active:scale-95 transition-all rounded-xl shadow-sm bg-transparent"
            >
              Notes
            </Button>
          ) : classData.pdfFiles.length > 1 ? (
            <Dropdown menu={{ items: pdfMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button
                icon={<Download size={20} />}
                className="flex items-center gap-2 h-12 px-6 font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#DC143C] dark:hover:text-rose-400 hover:border-[#DC143C] dark:hover:border-rose-900 active:scale-95 transition-all rounded-xl shadow-sm bg-transparent"
              >
                Resources
              </Button>
            </Dropdown>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default ClassCard;
