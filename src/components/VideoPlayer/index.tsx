// 视频播放器主组件

import React, { useState, useRef, useEffect } from "react";
import type { VideoPlayerProps, PlayerState } from "../../types/video";
import {
  createVideoObjectURL,
  revokeVideoObjectURL,
  calculateProgress,
  calculateTimeFromProgress,
  getPlaybackRateOptions,
  isPictureInPictureSupported,
  isFullscreenSupported,
} from "../../utils/videoUtils";
import { formatTime } from "../../utils/fileUtils";
import "./VideoPlayer.less";

const VideoPlayer: React.FC<VideoPlayerProps> = ({ currentVideo, onVideoEnd, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [objectURL, setObjectURL] = useState<string | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    currentVideo: null,
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
  });

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<number>(null);

  // 更新当前视频
  useEffect(() => {
    if (currentVideo) {
      // 清理之前的对象URL
      if (objectURL) {
        revokeVideoObjectURL(objectURL);
      }

      // 创建新的对象URL
      const newObjectURL = createVideoObjectURL(currentVideo);
      setObjectURL(newObjectURL);

      setPlayerState(prev => ({
        ...prev,
        currentVideo,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      }));
    }

    return () => {
      if (objectURL) {
        revokeVideoObjectURL(objectURL);
      }
    };
  }, [currentVideo]);

  // 视频加载完成
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlayerState(prev => ({
        ...prev,
        duration: videoRef.current!.duration,
        volume: videoRef.current!.volume,
      }));
    }
  };

  // 时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const currentTime = videoRef.current.currentTime;
      setPlayerState(prev => ({
        ...prev,
        currentTime,
      }));
      onTimeUpdate(currentTime);
    }
  };

  // 播放/暂停
  const togglePlay = () => {
    if (videoRef.current) {
      if (playerState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // 播放状态改变
  const handlePlay = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
  };

  // 视频结束
  const handleEnded = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    onVideoEnd();
  };

  // 音量控制
  const handleVolumeChange = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setPlayerState(prev => ({ ...prev, volume }));
    }
  };

  // 播放速度控制
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    }
  };

  // 进度条拖拽
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = (clickX / rect.width) * 100;
      const newTime = calculateTimeFromProgress(progress, playerState.duration);

      videoRef.current.currentTime = newTime;
      setPlayerState(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  // 全屏控制
  const toggleFullscreen = () => {
    if (!isFullscreenSupported()) return;

    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 画中画控制
  const togglePictureInPicture = async () => {
    if (!isPictureInPictureSupported() || !videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("画中画模式切换失败:", error);
    }
  };

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(playerState.duration, videoRef.current.currentTime + 10);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        handleVolumeChange(Math.min(1, playerState.volume + 0.1));
        break;
      case "ArrowDown":
        e.preventDefault();
        handleVolumeChange(Math.max(0, playerState.volume - 0.1));
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  // 控制栏显示/隐藏
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playerState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 鼠标移动时显示控制栏
  useEffect(() => {
    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    if (containerRef.current) {
      containerRef.current.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playerState.isPlaying]);

  const progress = calculateProgress(playerState.currentTime, playerState.duration);
  const playbackRateOptions = getPlaybackRateOptions();

  return (
    <div ref={containerRef} className={`video-player ${isFullscreen ? "fullscreen" : ""}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {currentVideo ? (
        <>
          <video
            ref={videoRef}
            src={objectURL || ""}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onClick={togglePlay}
            className='video-element'
          />

          <div className={`video-controls ${showControls ? "visible" : ""}`}>
            {/* 进度条 */}
            <div ref={progressBarRef} className='progress-container' onMouseDown={handleProgressMouseDown} onClick={handleProgressClick}>
              <div className='progress-bar'>
                <div className='progress-filled' style={{ width: `${progress}%` }} aria-label='播放进度' />
                <div className='progress-thumb' style={{ left: `${progress}%` }} aria-label='进度滑块' />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className='controls-row'>
              <div className='controls-left'>
                <button className='control-btn play-pause' onClick={togglePlay} title={playerState.isPlaying ? "暂停" : "播放"}>
                  {playerState.isPlaying ? "⏸️" : "▶️"}
                </button>

                <div className='volume-control'>
                  <button
                    className='control-btn volume-btn'
                    onClick={() => handleVolumeChange(playerState.volume > 0 ? 0 : 1)}
                    title={playerState.volume > 0 ? "静音" : "取消静音"}
                  >
                    {playerState.volume === 0 ? "🔇" : playerState.volume < 0.5 ? "🔉" : "🔊"}
                  </button>
                  <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.1'
                    value={playerState.volume}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                    className='volume-slider'
                    aria-label='音量控制'
                  />
                </div>

                <div className='time-display'>
                  <span>{formatTime(playerState.currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(playerState.duration)}</span>
                </div>
              </div>

              <div className='controls-right'>
                <select
                  value={playerState.playbackRate}
                  onChange={e => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className='playback-rate-select'
                  title='播放速度'
                >
                  {playbackRateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {isPictureInPictureSupported() && (
                  <button className='control-btn pip-btn' onClick={togglePictureInPicture} title='画中画'>
                    📺
                  </button>
                )}

                {isFullscreenSupported() && (
                  <button className='control-btn fullscreen-btn' onClick={toggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"}>
                    {isFullscreen ? "🗗" : "🗖"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className='no-video'>
          <div className='no-video-icon'>🎬</div>
          <div className='no-video-text'>请选择要播放的视频</div>
          <div className='no-video-hint'>从文件浏览器中选择视频文件开始播放</div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
