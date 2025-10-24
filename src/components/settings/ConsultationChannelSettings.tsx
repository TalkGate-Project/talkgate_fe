"use client";

import { useState } from "react";

interface ChannelCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function ChannelCard({ name, description, icon, isConnected, onConnect, onDisconnect }: ChannelCardProps) {
  return (
    <div className="flex items-center justify-between p-6 border border-[#E2E2E2] rounded-[12px] min-h-[132px]">
      {/* Left Content - Icon and Text */}
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-8 h-8">
          {icon}
        </div>
        
        {/* Text Content */}
        <div>
          {/* Channel Name */}
          <h3 className="text-[16px] font-semibold text-[#000000] mb-1 leading-6">
            {name}
          </h3>
          
          {/* Description */}
          <p className="text-[14px] font-medium text-[#808080] leading-6">
            {description}
          </p>
        </div>
      </div>
      
      {/* Right Content - Status and Button */}
      <div className="flex flex-col items-end gap-2">
        {isConnected && (
          <div className="flex items-center justify-center px-3 py-1 bg-[#D6FAE8] rounded-[30px]">
            <span className="text-[12px] font-medium text-[#00B55B] opacity-80">
              연결됨
            </span>
          </div>
        )}
        
        <button
          onClick={isConnected ? onDisconnect : onConnect}
          className={`flex items-center justify-center px-4 py-2 rounded-[5px] text-[14px] font-semibold ${
            isConnected
              ? "bg-white border border-[#E2E2E2] text-[#000000] hover:bg-gray-50"
              : "bg-[#252525] text-[#D0D0D0] hover:bg-[#333333]"
          } transition-colors`}
        >
          {isConnected ? "연결해제" : "연결하기"}
        </button>
      </div>
    </div>
  );
}

export default function ConsultationChannelSettings() {
  const [channels, setChannels] = useState([
    {
      id: "instagram",
      name: "Instagram",
      description: "인스타그램 DM연동",
      isConnected: false,
    },
    {
      id: "telegram",
      name: "Telegram", 
      description: "텔레그램 봇 연동",
      isConnected: true,
    },
    {
      id: "line",
      name: "LINE",
      description: "라인 공식 계정 연동", 
      isConnected: false,
    },
  ]);

  const connectedCount = channels.filter(channel => channel.isConnected).length;

  const handleConnect = (channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, isConnected: true } : channel
    ));
  };

  const handleDisconnect = (channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, isConnected: false } : channel
    ));
  };

  const renderIcon = (channelId: string) => {
    switch (channelId) {
      case "instagram":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
        );
      case "telegram":
        return (
          <div className="w-8 h-8 bg-[#29A8E9] rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
        );
      case "line":
        return (
          <div className="w-8 h-8 bg-[#06C755] rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-[#252525] leading-5">
          상담 채널 연동
        </h1>
        <div className="flex items-center px-3 py-1 bg-[#D6FAE8] rounded-[30px]">
          <span className="text-[12px] font-medium text-[#00B55B] opacity-80">
            연결된 채널 : {connectedCount}개
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#E2E2E2] opacity-50 mb-12"></div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {channels.map((channel, index) => (
          <ChannelCard
            key={channel.id}
            name={channel.name}
            description={channel.description}
            icon={renderIcon(channel.id)}
            isConnected={channel.isConnected}
            onConnect={() => handleConnect(channel.id)}
            onDisconnect={() => handleDisconnect(channel.id)}
          />
        ))}
      </div>
    </div>
  );
}
