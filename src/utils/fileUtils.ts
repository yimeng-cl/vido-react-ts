// 文件处理工具函数

import type { VideoFile, FolderNode } from '../types/video';
import { SUPPORTED_VIDEO_FORMATS } from '../types/video';

/**
 * 检查文件是否为支持的视频格式
 * @param file 文件对象
 * @returns 是否为支持的视频格式
 */
export const isVideoFile = (file: File): boolean => {
  return SUPPORTED_VIDEO_FORMATS.includes(file.type as any) ||
    isVideoByExtension(file.name);
};

/**
 * 根据文件扩展名判断是否为视频文件
 * @param fileName 文件名
 * @returns 是否为视频文件
 */
export const isVideoByExtension = (fileName: string): boolean => {
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov',
    '.wmv', '.flv', '.mkv', '.m4v', '.3gp'
  ];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return videoExtensions.includes(extension);
};

/**
 * 将文件列表转换为视频文件对象数组
 * @param files 文件列表
 * @returns 视频文件对象数组
 */
export const convertFilesToVideoFiles = (files: FileList): VideoFile[] => {
  const videoFiles: VideoFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (isVideoFile(file)) {
      videoFiles.push({
        file,
        name: file.name,
        path: file.webkitRelativePath || file.name,
        size: file.size
      });
    }
  }

  return videoFiles;
};

/**
 * 构建完整文件夹树结构（包含所有文件）
 * @param files 所有文件数组
 * @returns 文件夹树结构
 */
export const buildCompleteFolderTree = (files: FileList): FolderNode[] => {
  const folderMap = new Map<string, FolderNode>();
  const rootFolders: FolderNode[] = [];

  // 初始化根文件夹
  const getRootFolder = (): FolderNode => {
    if (!folderMap.has('')) {
      const rootFolder: FolderNode = {
        name: '根目录',
        path: '',
        children: [],
        videos: [],
        allFiles: [],
        isExpanded: true
      };
      folderMap.set('', rootFolder);
      rootFolders.push(rootFolder);
    }
    return folderMap.get('')!;
  };

  // 转换所有文件为统一格式
  const allFiles: any[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    allFiles.push({
      file,
      name: file.name,
      path: file.webkitRelativePath || file.name,
      size: file.size,
      isVideo: isVideoFile(file)
    });
  }

  allFiles.forEach(fileItem => {
    const pathParts = fileItem.path.split('/');
    pathParts.pop(); // 移除文件名，只保留路径部分

    // 如果没有路径分隔符，直接放到根目录
    if (pathParts.length === 0) {
      const rootFolder = getRootFolder();
      rootFolder.allFiles = rootFolder.allFiles || [];
      rootFolder.allFiles.push(fileItem);
      if (fileItem.isVideo) {
        rootFolder.videos.push({
          file: fileItem.file,
          name: fileItem.name,
          path: fileItem.path,
          size: fileItem.size
        });
      }
      return;
    }

    let currentPath = '';
    let currentParent: FolderNode | null = null;

    // 构建文件夹层级结构
    pathParts.forEach((folderName: string) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(currentPath)) {
        const newFolder: FolderNode = {
          name: folderName,
          path: currentPath,
          children: [],
          videos: [],
          allFiles: [],
          isExpanded: false
        };

        folderMap.set(currentPath, newFolder);

        // 添加到父文件夹或根目录
        if (currentParent) {
          currentParent.children.push(newFolder);
        } else if (parentPath === '') {
          rootFolders.push(newFolder);
        } else {
          const parentFolder = folderMap.get(parentPath);
          if (parentFolder) {
            parentFolder.children.push(newFolder);
          }
        }
      }

      currentParent = folderMap.get(currentPath) || null;
    });

    // 将文件添加到对应文件夹
    if (currentParent) {
      const folder = currentParent as FolderNode;
      folder.allFiles = folder.allFiles || [];
      folder.allFiles.push(fileItem);
      if (fileItem.isVideo) {
        folder.videos.push({
          file: fileItem.file,
          name: fileItem.name,
          path: fileItem.path,
          size: fileItem.size
        });
      }
    }
  });

  // 对所有文件夹中的文件进行排序
  const sortFolderContents = (folder: FolderNode) => {
    // 排序当前文件夹的所有文件
    if (folder.allFiles && folder.allFiles.length > 0) {
      folder.allFiles = sortFilesByNumber(folder.allFiles);
    }

    // 排序当前文件夹的视频文件
    if (folder.videos && folder.videos.length > 0) {
      folder.videos = sortFilesByNumber(folder.videos);
    }

    // 排序子文件夹，并递归排序子文件夹的内容
    if (folder.children && folder.children.length > 0) {
      folder.children = sortFilesByNumber(folder.children);
      folder.children.forEach(child => sortFolderContents(child));
    }
  };

  // 对根文件夹进行排序
  rootFolders.forEach(folder => sortFolderContents(folder));

  // 对根文件夹本身也进行排序
  const sortedRootFolders = sortFilesByNumber(rootFolders);

  return sortedRootFolders;
};

/**
 * 构建文件夹树结构
 * @param videoFiles 视频文件数组
 * @returns 文件夹树结构
 */
export const buildFolderTree = (videoFiles: VideoFile[]): FolderNode[] => {
  const folderMap = new Map<string, FolderNode>();
  const rootFolders: FolderNode[] = [];

  // 初始化根文件夹
  const getRootFolder = (): FolderNode => {
    if (!folderMap.has('')) {
      const rootFolder: FolderNode = {
        name: '根目录',
        path: '',
        children: [],
        videos: [],
        isExpanded: true
      };
      folderMap.set('', rootFolder);
      rootFolders.push(rootFolder);
    }
    return folderMap.get('')!;
  };

  videoFiles.forEach(video => {
    const pathParts = video.path.split('/');
    pathParts.pop(); // 移除文件名，只保留路径部分

    // 如果没有路径分隔符，直接放到根目录
    if (pathParts.length === 0) {
      const rootFolder = getRootFolder();
      rootFolder.videos.push(video);
      return;
    }

    let currentPath = '';
    let currentParent: FolderNode | null = null;

    // 构建文件夹层级结构
    pathParts.forEach((folderName) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(currentPath)) {
        const newFolder: FolderNode = {
          name: folderName,
          path: currentPath,
          children: [],
          videos: [],
          isExpanded: false
        };

        folderMap.set(currentPath, newFolder);

        // 添加到父文件夹或根目录
        if (currentParent) {
          currentParent.children.push(newFolder);
        } else if (parentPath === '') {
          rootFolders.push(newFolder);
        } else {
          const parentFolder = folderMap.get(parentPath);
          if (parentFolder) {
            parentFolder.children.push(newFolder);
          }
        }
      }

      currentParent = folderMap.get(currentPath) || null;
    });

    // 将视频文件添加到对应文件夹
    if (currentParent) {
      (currentParent as FolderNode).videos.push(video);
    }
  });

  return rootFolders;
};

/**
 * 提取文件名中的数字用于排序
 * @param fileName 文件名
 * @returns 提取的数字，如果没有数字则返回Infinity（排在最后）
 */
export const extractNumberFromFileName = (fileName: string): number => {
  // 尝试多种数字匹配模式
  const patterns = [
    /第(\d+)节/,           // 匹配 "第1节"、"第10节" 等
    /第(\d+)章/,           // 匹配 "第1章"、"第10章" 等
    /第(\d+)课/,           // 匹配 "第1课"、"第10课" 等
    /^(\d+)/,              // 匹配开头的数字
    /(\d+)/                // 匹配任何数字
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return Infinity;
};



/**
 * 按文件名中的数字排序
 * @param files 文件数组
 * @returns 排序后的文件数组
 */
export const sortFilesByNumber = <T extends { name: string }>(files: T[]): T[] => {
  return [...files].sort((a, b) => {
    const numA = extractNumberFromFileName(a.name);
    const numB = extractNumberFromFileName(b.name);

    // 如果两个都有数字，按数字排序
    if (numA !== Infinity && numB !== Infinity) {
      return numA - numB;
    }

    // 如果只有一个有数字，有数字的排在前面
    if (numA !== Infinity && numB === Infinity) {
      return -1;
    }
    if (numA === Infinity && numB !== Infinity) {
      return 1;
    }

    // 如果都没有数字，按字母顺序排序
    return a.name.localeCompare(b.name);
  });
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化时间（秒转换为时:分:秒格式）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 获取文件夹中所有视频文件
 * @param folder 文件夹节点
 * @returns 所有视频文件数组
 */
export const getAllVideosFromFolder = (folder: FolderNode): VideoFile[] => {
  let allVideos: VideoFile[] = [...folder.videos];

  folder.children.forEach(child => {
    allVideos = allVideos.concat(getAllVideosFromFolder(child));
  });

  return allVideos;
};

/**
 * 搜索视频文件
 * @param folders 文件夹数组
 * @param searchTerm 搜索关键词
 * @returns 匹配的视频文件数组
 */
export const searchVideos = (folders: FolderNode[], searchTerm: string): VideoFile[] => {
  const results: VideoFile[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  const searchInFolder = (folder: FolderNode) => {
    // 搜索当前文件夹的视频
    folder.videos.forEach(video => {
      if (video.name.toLowerCase().includes(lowerSearchTerm)) {
        results.push(video);
      }
    });

    // 递归搜索子文件夹
    folder.children.forEach(child => {
      searchInFolder(child);
    });
  };

  folders.forEach(folder => {
    searchInFolder(folder);
  });

  return results;
};
