// 视频文件相关类型定义

export interface VideoFile {
  file: File; // 原始文件对象
  name: string; // 文件名
  path: string; // 文件路径
  size: number; // 文件大小（字节）
  duration?: number; // 视频时长（秒）
  thumbnail?: string; // 缩略图URL
}

export interface FolderNode {
  name: string; // 文件夹名称
  path: string; // 文件夹路径
  children: FolderNode[]; // 子文件夹
  videos: VideoFile[]; // 该文件夹下的视频文件
  allFiles?: any[]; // 该文件夹下的所有文件（包含非视频文件）
  isExpanded?: boolean; // 是否展开
}

export interface PlaylistItem {
  id: string; // 播放项唯一标识
  video: VideoFile; // 视频文件信息
  isPlaying?: boolean; // 是否正在播放
  playedTime?: number; // 已播放时间
}

export interface PlayerState {
  currentVideo: VideoFile | null; // 当前播放的视频
  playlist: PlaylistItem[]; // 播放列表
  currentIndex: number; // 当前播放索引
  isPlaying: boolean; // 是否正在播放
  volume: number; // 音量 (0-1)
  currentTime: number; // 当前播放时间
  duration: number; // 视频总时长
  playbackRate: number; // 播放速度
}

export interface FileExplorerProps {
  currentVideo: VideoFile | null; // 当前视频
  onVideoSelect: (video: VideoFile) => void; // 选择视频回调
  setPlaylist: (playlist: VideoFile[]) => void; // 设置播放列表回调
}

export interface VideoPlayerProps {
  currentVideo: VideoFile | null; // 当前视频
  onVideoEnd: () => void; // 视频播放结束回调
  onTimeUpdate: (currentTime: number) => void; // 时间更新回调
}

export interface PlayListProps {
  playlist: PlaylistItem[]; // 播放列表
  currentIndex: number; // 当前播放索引
  onVideoSelect: (index: number) => void; // 选择视频回调
  onRemoveVideo: (index: number) => void; // 移除视频回调
}

// 支持的视频格式
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/mkv'
] as const;

export type SupportedVideoFormat = typeof SUPPORTED_VIDEO_FORMATS[number];
