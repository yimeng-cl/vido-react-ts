import { useState } from "react";
import type { VideoFile, FolderNode, PlaylistItem } from "./types/video";
import FileExplorer from "./components/FileExplorer";
import VideoPlayer from "./components/VideoPlayer";
import "./styles/App.less";

function App() {
  const [, setFolders] = useState<FolderNode[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // 处理视频选择
  const handleVideoSelect = (video: VideoFile) => {
    // 检查是否已在播放列表中
    const existingIndex = playlist.findIndex(item => item.video.path === video.path && item.video.name === video.name);

    if (existingIndex !== -1) {
      // 如果已存在，直接播放
      setCurrentIndex(existingIndex);
      setCurrentVideo(video);
    } else {
      // 添加到播放列表
      const newPlaylistItem: PlaylistItem = {
        id: `${Date.now()}-${Math.random()}`,
        video,
        isPlaying: false,
      };

      const newPlaylist = [...playlist, newPlaylistItem];
      setPlaylist(newPlaylist);
      setCurrentIndex(newPlaylist.length - 1);
      setCurrentVideo(video);
    }
  };

  // 处理文件夹加载
  const handleFolderLoad = (loadedFolders: FolderNode[]) => {
    setFolders(loadedFolders);
  };

  // 处理视频播放结束
  const handleVideoEnd = () => {
    // 自动播放下一个视频
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentVideo(playlist[nextIndex].video);
    }
  };

  // 处理时间更新
  const handleTimeUpdate = (currentTime: number) => {
    if (currentIndex >= 0 && currentIndex < playlist.length) {
      const updatedPlaylist = [...playlist];
      updatedPlaylist[currentIndex] = {
        ...updatedPlaylist[currentIndex],
        playedTime: currentTime,
      };
      setPlaylist(updatedPlaylist);
    }
  };

  return (
    <div className='video-app'>
      <div className='app-content'>
        <div className='left-panel-wide'>
          <FileExplorer onVideoSelect={handleVideoSelect} onFolderLoad={handleFolderLoad} />
        </div>

        <div className='center-panel-wide'>
          <VideoPlayer currentVideo={currentVideo} playlist={playlist} onVideoEnd={handleVideoEnd} onTimeUpdate={handleTimeUpdate} />
        </div>
      </div>
    </div>
  );
}

export default App;
