// 文件浏览器组件

import React, { useState, useRef, useEffect } from "react";
import { Button, Input, Tree, Empty, Spin, Card, Typography, Space } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import type { FileExplorerProps, FolderNode, VideoFile } from "../../types/video";
import {
  convertFilesToVideoFiles,
  buildCompleteFolderTree,
  formatFileSize,
  getAllVideosFromFolder,
  searchVideos,
  sortFilesByNumber,
} from "../../utils/fileUtils";
import "./FileExplorer.less";

const { Search } = Input;
const { Title, Text } = Typography;

// 缓存键名
const FOLDER_CACHE_KEY = "video-player-last-folder";
const FOLDER_CONTENT_CACHE_KEY = "video-player-folder-content";

const FileExplorer: React.FC<FileExplorerProps> = ({ onVideoSelect, onFolderLoad }) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoFile[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [lastFolderPath, setLastFolderPath] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 保存文件夹路径到缓存
  const saveFolderToCache = (files: FileList, folderTree: FolderNode[]) => {
    if (files.length > 0) {
      const firstFile = files[0];
      const folderPath = firstFile.webkitRelativePath ? firstFile.webkitRelativePath.split("/")[0] : "未知文件夹";

      // 保存基本信息
      localStorage.setItem(
        FOLDER_CACHE_KEY,
        JSON.stringify({
          folderName: folderPath,
          timestamp: Date.now(),
          fileCount: files.length,
        })
      );

      // 保存文件夹结构（简化版，不包含File对象）
      const simplifiedTree = simplifyFolderTree(folderTree);
      localStorage.setItem(
        FOLDER_CONTENT_CACHE_KEY,
        JSON.stringify({
          folderTree: simplifiedTree,
          timestamp: Date.now(),
        })
      );

      setLastFolderPath(folderPath);
    }
  };

  // 简化文件夹树结构，移除File对象以便序列化
  const simplifyFolderTree = (folders: FolderNode[]): any[] => {
    return folders.map(folder => ({
      name: folder.name,
      path: folder.path,
      children: simplifyFolderTree(folder.children),
      videos: folder.videos.map(video => ({
        name: video.name,
        path: video.path,
        size: video.size,
      })),
      allFiles:
        folder.allFiles?.map(file => ({
          name: file.name,
          path: file.path,
          size: file.size,
          isVideo: file.isVideo,
        })) || [],
      isExpanded: folder.isExpanded,
    }));
  };

  // 从缓存加载文件夹信息
  const loadFolderFromCache = () => {
    try {
      const cached = localStorage.getItem(FOLDER_CACHE_KEY);
      const contentCached = localStorage.getItem(FOLDER_CONTENT_CACHE_KEY);

      if (cached) {
        const { folderName, timestamp, fileCount } = JSON.parse(cached);
        setLastFolderPath(folderName);

        // 如果有内容缓存，尝试加载
        if (contentCached) {
          const { folderTree, timestamp: contentTimestamp } = JSON.parse(contentCached);

          // 检查缓存是否过期（7天）
          const isExpired = Date.now() - contentTimestamp > 7 * 24 * 60 * 60 * 1000;

          if (!isExpired && folderTree) {
            // 恢复文件夹结构（但没有File对象，所以无法播放）
            const restoredFolders = restoreFolderTree(folderTree);
            setFolders(restoredFolders);
            setTreeData(convertToTreeData(restoredFolders));
            onFolderLoad(restoredFolders);

            console.log(`从缓存恢复文件夹结构：${folderName}（${fileCount}个文件）`);
            console.log("注意：需要重新选择文件夹才能播放视频");

            return { folderName, timestamp, fileCount, restored: true };
          }
        }

        return { folderName, timestamp, fileCount, restored: false };
      }
    } catch (error) {
      console.warn("加载缓存失败:", error);
    }
    return null;
  };

  // 恢复文件夹树结构
  const restoreFolderTree = (simplifiedTree: any[]): FolderNode[] => {
    return simplifiedTree.map(folder => ({
      name: folder.name,
      path: folder.path,
      children: restoreFolderTree(folder.children || []),
      videos: folder.videos || [],
      allFiles: folder.allFiles || [],
      isExpanded: folder.isExpanded || false,
    }));
  };

  // 组件初始化时加载缓存
  useEffect(() => {
    loadFolderFromCache();
  }, []);

  // 将文件夹结构转换为Antd Tree组件需要的数据格式
  const convertToTreeData = (folders: FolderNode[]): any[] => {
    const convertNode = (node: FolderNode): any => {
      const children: any[] = [];

      // 添加所有文件（保持原始顺序）
      if (node.allFiles && node.allFiles.length > 0) {
        node.allFiles.forEach((fileItem, index) => {
          children.push({
            title: (
              <Space>
                <Text ellipsis style={{ maxWidth: 180 }}>
                  {fileItem.name}
                </Text>
                <Text type='secondary' style={{ fontSize: "12px" }}>
                  {formatFileSize(fileItem.size)}
                </Text>
                {fileItem.isVideo && (
                  <Text type='success' style={{ fontSize: "10px" }}>
                    视频
                  </Text>
                )}
              </Space>
            ),
            key: `file-${node.path}-${index}`,
            isLeaf: true,
            fileData: fileItem,
            selectable: true,
          });
        });
      }

      // 然后添加子文件夹
      node.children.forEach(child => {
        children.push(convertNode(child));
      });

      const totalFiles = node.allFiles ? node.allFiles.length : 0;
      const videoCount = getAllVideosFromFolder(node).length;

      return {
        title: (
          <Space>
            <Text strong>{node.name}</Text>
            <Text type='secondary' style={{ fontSize: "12px" }}>
              ({totalFiles} 个文件, {videoCount} 个视频)
            </Text>
          </Space>
        ),
        key: `folder-${node.path}`,
        children: children.length > 0 ? children : undefined,
        folderData: node,
      };
    };

    return folders.map(folder => convertNode(folder));
  };

  // 处理文件夹选择
  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      // 构建完整文件夹树（包含所有文件）
      const folderTree = buildCompleteFolderTree(files);

      // 保存文件夹到缓存（包含文件夹结构）
      saveFolderToCache(files, folderTree);

      setFolders(folderTree);
      setTreeData(convertToTreeData(folderTree));
      onFolderLoad(folderTree);

      // 清空搜索
      setSearchTerm("");
      setSearchResults([]);

      // 检查是否有视频文件
      const videoFiles = convertFilesToVideoFiles(files);
      if (videoFiles.length === 0) {
        alert("提示：所选文件夹中没有找到支持的视频文件，但您可以浏览所有文件");
      }
    } catch (error) {
      console.error("处理文件夹时出错:", error);
      alert("处理文件夹时出错，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = searchVideos(folders, value);
    // 对搜索结果也进行排序
    const sortedResults = sortFilesByNumber(results);
    setSearchResults(sortedResults);
  };

  // 处理Tree节点选择
  const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
    const selectedKey = selectedKeys[0];
    if (selectedKey && selectedKey.toString().startsWith("file-")) {
      const selectedNode = info.selectedNodes[0];
      if (selectedNode && selectedNode.fileData) {
        const fileData = selectedNode.fileData;

        // 检查是否有实际的File对象（从缓存恢复的没有File对象）
        if (!fileData.file) {
          alert(`这是从缓存恢复的文件列表。\n\n要播放视频，请重新选择文件夹。`);
          return;
        }

        if (fileData.isVideo) {
          // 是视频文件，创建VideoFile对象并播放
          const videoFile: VideoFile = {
            file: fileData.file,
            name: fileData.name,
            path: fileData.path,
            size: fileData.size,
          };
          onVideoSelect(videoFile);
        } else {
          // 不是视频文件，显示提示
          alert(`"${fileData.name}" 不是支持的视频文件格式。\n\n支持的格式：MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV`);
        }
      }
    }
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='没有找到匹配的视频文件' />;
    }

    return (
      <div className='search-results'>
        <Title level={5} className='search-title'>
          搜索结果 ({searchResults.length} 个文件)
        </Title>
        <Space direction='vertical' className='search-space'>
          {searchResults.map((video, index) => (
            <Card key={`search-${index}`} size='small' hoverable onClick={() => onVideoSelect(video)} className='search-card'>
              <Space>
                <div className='video-info-container'>
                  <Text strong ellipsis>
                    {video.name}
                  </Text>
                  <br />
                  <Text type='secondary'>{video.path}</Text>
                </div>
                <Text type='secondary'>{formatFileSize(video.size)}</Text>
              </Space>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <FolderOpenOutlined />
          <span>文件浏览器</span>
        </Space>
      }
      extra={
        <Button type='primary' onClick={() => fileInputRef.current?.click()} loading={isLoading} size='small'>
          {isLoading ? "加载中..." : "选择文件夹"}
        </Button>
      }
      size='small'
      className='file-explorer-card'
    >
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type='file'
        {...({ webkitdirectory: "" } as any)}
        multiple
        className='hidden-input'
        onChange={handleFolderSelect}
        aria-label='选择文件夹'
      />

      {/* 上次选择的文件夹信息 */}
      {lastFolderPath && folders.length === 0 && (
        <div className='last-folder-info'>
          <Text type='secondary' style={{ fontSize: "12px" }}>
            💾 上次选择：{lastFolderPath}
          </Text>
        </div>
      )}

      {/* 缓存恢复提示 */}
      {folders.length > 0 && lastFolderPath && (
        <div className='cache-restore-info'>
          <Text type='secondary' style={{ fontSize: "11px" }}>
            📂 已从缓存恢复：{lastFolderPath} | 💡 要播放视频请重新选择文件夹
          </Text>
        </div>
      )}

      {/* 搜索框 */}
      {folders.length > 0 && (
        <Search placeholder='搜索视频文件...' value={searchTerm} onChange={e => handleSearch(e.target.value)} style={{ marginBottom: 16 }} size='small' />
      )}

      {/* 内容区域 */}
      <div className='explorer-content'>
        {isLoading && (
          <div className='loading-container'>
            <Spin size='large' />
            <div className='loading-text'>正在加载文件...</div>
          </div>
        )}

        {!isLoading && folders.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div>请选择包含视频文件的文件夹</div>
                <Text type='secondary' style={{ fontSize: "12px" }}>
                  支持格式：MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV
                </Text>
              </div>
            }
          />
        )}

        {!isLoading && folders.length > 0 && (
          <>
            {searchTerm ? (
              renderSearchResults()
            ) : (
              <Tree treeData={treeData} onSelect={handleTreeSelect} showIcon={false} defaultExpandAll={false} className='file-tree' />
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default FileExplorer;
