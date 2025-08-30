// 视频处理工具函数

import type { VideoFile } from '../types/video';

/**
 * 获取视频元数据（时长、尺寸等）
 * @param videoFile 视频文件对象
 * @returns Promise<视频元数据>
 */
export const getVideoMetadata = (videoFile: VideoFile): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectURL = URL.createObjectURL(videoFile.file);

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      };

      // 清理对象URL
      URL.revokeObjectURL(objectURL);
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('无法加载视频元数据'));
    };

    video.src = objectURL;
  });
};

/**
 * 生成视频缩略图
 * @param videoFile 视频文件对象
 * @param timeOffset 截取时间点（秒），默认为5秒
 * @returns Promise<缩略图base64字符串>
 */
export const generateVideoThumbnail = (
  videoFile: VideoFile,
  timeOffset: number = 5
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const objectURL = URL.createObjectURL(videoFile.file);

    if (!ctx) {
      reject(new Error('无法创建canvas上下文'));
      return;
    }

    video.onloadedmetadata = () => {
      // 设置canvas尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 设置截取时间点
      video.currentTime = Math.min(timeOffset, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 转换为base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

        // 清理资源
        URL.revokeObjectURL(objectURL);
        resolve(thumbnail);
      } catch (error) {
        URL.revokeObjectURL(objectURL);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('无法加载视频文件'));
    };

    video.src = objectURL;
    video.load();
  });
};

/**
 * 创建视频对象URL
 * @param videoFile 视频文件对象
 * @returns 对象URL字符串
 */
export const createVideoObjectURL = (videoFile: VideoFile): string => {
  return URL.createObjectURL(videoFile.file);
};

/**
 * 释放视频对象URL
 * @param objectURL 对象URL字符串
 */
export const revokeVideoObjectURL = (objectURL: string): void => {
  URL.revokeObjectURL(objectURL);
};

/**
 * 检测浏览器对视频格式的支持
 * @param mimeType 视频MIME类型
 * @returns 是否支持该格式
 */
export const isVideoFormatSupported = (mimeType: string): boolean => {
  const video = document.createElement('video');
  return video.canPlayType(mimeType) !== '';
};

/**
 * 获取视频播放支持信息
 * @param mimeType 视频MIME类型
 * @returns 支持级别 ('probably' | 'maybe' | '')
 */
export const getVideoSupportLevel = (mimeType: string): string => {
  const video = document.createElement('video');
  return video.canPlayType(mimeType);
};

/**
 * 预加载视频文件
 * @param videoFile 视频文件对象
 * @returns Promise<HTMLVideoElement>
 */
export const preloadVideo = (videoFile: VideoFile): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectURL = URL.createObjectURL(videoFile.file);

    video.oncanplaythrough = () => {
      resolve(video);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('视频预加载失败'));
    };

    video.preload = 'metadata';
    video.src = objectURL;
    video.load();
  });
};

/**
 * 计算视频播放进度百分比
 * @param currentTime 当前播放时间
 * @param duration 视频总时长
 * @returns 进度百分比 (0-100)
 */
export const calculateProgress = (currentTime: number, duration: number): number => {
  if (!duration || duration === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
};

/**
 * 根据进度百分比计算播放时间
 * @param progress 进度百分比 (0-100)
 * @param duration 视频总时长
 * @returns 对应的播放时间
 */
export const calculateTimeFromProgress = (progress: number, duration: number): number => {
  return (progress / 100) * duration;
};

/**
 * 获取推荐的播放速度选项
 * @returns 播放速度选项数组
 */
export const getPlaybackRateOptions = (): { value: number; label: string }[] => {
  return [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' }
  ];
};

/**
 * 检查是否支持画中画模式
 * @returns 是否支持画中画
 */
export const isPictureInPictureSupported = (): boolean => {
  return 'pictureInPicture' in document;
};

/**
 * 检查是否支持全屏模式
 * @returns 是否支持全屏
 */
export const isFullscreenSupported = (): boolean => {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
};
