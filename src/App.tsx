import { useState } from "react";
import FileExplorer from "./components/FileExplorer";
import VideoPlayer from "./components/VideoPlayer";
import "./styles/App.less";
import type { VideoFile } from "./types/video";

function App() {
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [playlist, setPlaylist] = useState<VideoFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // 处理视频选择
  const handleVideoSelect = (video: VideoFile) => {
    // 检查是否已在播放列表中
    const existingIndex = playlist.findIndex(item => item.path === video.path && item.name === video.name);

    if (existingIndex !== -1) {
      // 如果已存在，直接播放
      setCurrentIndex(existingIndex);
      setCurrentVideo(video);
    }
  };

  // 处理视频播放结束
  const handleVideoEnd = () => {
    // 自动播放下一个视频
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentVideo(playlist[nextIndex]);
    }
  };

  // 处理时间更新
  const handleTimeUpdate = () => {
    // if (currentIndex >= 0 && currentIndex < playlist.length) {
    //   const updatedPlaylist = [...playlist];
    //   updatedPlaylist[currentIndex] = {
    //     ...updatedPlaylist[currentIndex],
    //     playedTime: currentTime,
    //   };
    // }
  };

  return (
    <div className='video-app'>
      <div className='app-content'>
        <div className='left-panel-wide'>
          <FileExplorer currentVideo={currentVideo} onVideoSelect={handleVideoSelect} setPlaylist={setPlaylist} />
        </div>

        <div className='center-panel-wide'>
          <VideoPlayer currentVideo={currentVideo} onVideoEnd={handleVideoEnd} onTimeUpdate={handleTimeUpdate} />
        </div>
      </div>
    </div>
  );
}

export default App;
