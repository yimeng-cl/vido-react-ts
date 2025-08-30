// 播放列表组件

import React, { useState } from "react";
import type { PlayListProps, PlaylistItem } from "../../types/video";
import { formatFileSize, formatTime } from "../../utils/fileUtils";
import "./PlayList.less";

const PlayList: React.FC<PlayListProps> = ({ playlist, currentIndex, onVideoSelect, onRemoveVideo }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "size" | "duration">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 排序播放列表
  const getSortedPlaylist = (): PlaylistItem[] => {
    const sorted = [...playlist].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.video.name.localeCompare(b.video.name);
          break;
        case "size":
          comparison = a.video.size - b.video.size;
          break;
        case "duration":
          const aDuration = a.video.duration || 0;
          const bDuration = b.video.duration || 0;
          comparison = aDuration - bDuration;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  // 处理排序
  const handleSort = (newSortBy: "name" | "size" | "duration") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  // 获取排序图标
  const getSortIcon = (field: "name" | "size" | "duration") => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // 清空播放列表
  const handleClearPlaylist = () => {
    if (window.confirm("确定要清空播放列表吗？")) {
      // 从后往前删除，避免索引变化
      for (let i = playlist.length - 1; i >= 0; i--) {
        onRemoveVideo(i);
      }
    }
  };

  const sortedPlaylist = getSortedPlaylist();

  return (
    <div className={`playlist ${isMinimized ? "minimized" : ""}`}>
      <div className='playlist-header'>
        <div className='header-left'>
          <h3>播放列表</h3>
          <span className='playlist-count'>({playlist.length} 个视频)</span>
        </div>
        <div className='header-controls'>
          {playlist.length > 0 && (
            <button className='clear-btn' onClick={handleClearPlaylist} title='清空播放列表'>
              🗑️
            </button>
          )}
          <button className='minimize-btn' onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "展开" : "收起"}>
            {isMinimized ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {playlist.length > 0 && (
            <div className='playlist-controls'>
              <div className='sort-controls'>
                <span className='sort-label'>排序：</span>
                <button className={`sort-btn ${sortBy === "name" ? "active" : ""}`} onClick={() => handleSort("name")}>
                  名称 {getSortIcon("name")}
                </button>
                <button className={`sort-btn ${sortBy === "size" ? "active" : ""}`} onClick={() => handleSort("size")}>
                  大小 {getSortIcon("size")}
                </button>
                <button className={`sort-btn ${sortBy === "duration" ? "active" : ""}`} onClick={() => handleSort("duration")}>
                  时长 {getSortIcon("duration")}
                </button>
              </div>
            </div>
          )}

          <div className='playlist-content'>
            {playlist.length === 0 ? (
              <div className='empty-playlist'>
                <div className='empty-icon'>🎵</div>
                <div className='empty-text'>播放列表为空</div>
                <div className='empty-hint'>从文件浏览器中选择视频文件添加到播放列表</div>
              </div>
            ) : (
              <div className='playlist-items'>
                {sortedPlaylist.map((item, sortedIndex) => {
                  // 找到原始索引
                  const originalIndex = playlist.findIndex(p => p.id === item.id);
                  const isCurrentPlaying = originalIndex === currentIndex;

                  return (
                    <div
                      key={item.id}
                      className={`playlist-item ${isCurrentPlaying ? "current" : ""} ${item.isPlaying ? "playing" : ""}`}
                      onClick={() => onVideoSelect(originalIndex)}
                    >
                      <div className='item-index'>
                        {isCurrentPlaying ? <span className='playing-indicator'>▶</span> : <span className='item-number'>{sortedIndex + 1}</span>}
                      </div>

                      <div className='item-info'>
                        <div className='video-name' title={item.video.name}>
                          {item.video.name}
                        </div>
                        <div className='video-details'>
                          <span className='video-size'>{formatFileSize(item.video.size)}</span>
                          {item.video.duration && (
                            <>
                              <span className='separator'>•</span>
                              <span className='video-duration'>{formatTime(item.video.duration)}</span>
                            </>
                          )}
                          {item.playedTime && item.playedTime > 0 && (
                            <>
                              <span className='separator'>•</span>
                              <span className='played-time'>已播放 {formatTime(item.playedTime)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className='item-actions'>
                        <button
                          className='remove-btn'
                          onClick={e => {
                            e.stopPropagation();
                            onRemoveVideo(originalIndex);
                          }}
                          title='从播放列表中移除'
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayList;
