<template>
  <div class="workbench-container">
    <h1>学习工作台</h1>
    
    <!-- 分为左右多部分的布局 -->
    <div class="workbench-layout">
      <!-- 左侧文件树 -->
      <div class="file-tree-panel" :style="{ width: fileTreeWidth + 'px' }">
        <h3 class="panel-title">文件资源</h3>
        <div v-if="isLoadingTree" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-else-if="treeError" class="error-message">
          {{ treeError }}
        </div>
        <div v-else class="tree-container">
          <file-tree-node 
            v-for="item in resourceTree" 
            :key="item.fid" 
            :node="item" 
            @node-click="handleNodeClick"
            @node-context-menu="handleNodeContextMenu"
          />
        </div>
        
        <!-- 添加调整大小的分隔线 -->
        <Resizer :onResize="handleTreeResize" />
      </div>
      
      <!-- 中间链接预览区域 - 仅在有预览内容时显示 -->
      <template v-if="previewFile">
        <div class="preview-panel" :style="{ width: previewPanelWidth + 'px' }">
          <div class="preview-header">
            <div class="preview-title">
              <h3>预览: {{ previewFile.fName }}</h3>
              <span class="preview-path">{{ previewFile.URL }}</span>
            </div>
            <button class="close-button preview-close" @click="closePreview" title="关闭预览">
              <span>×</span>
            </button>
          </div>
          <div v-if="isLoadingPreview" class="loading-state">
            <div class="spinner"></div>
            <span>加载预览内容中...</span>
          </div>
          <div v-else-if="previewError" class="error-message">
            {{ previewError }}
          </div>
          <div v-else class="markdown-content preview-content" v-html="renderedPreviewContent"></div>
        </div>
        <!-- 预览面板和右侧内容之间的分隔线 -->
        <Resizer :onResize="handlePreviewResize" />
      </template>
      
      <!-- 右侧文件内容 -->
      <div class="file-content-panel">
        <div v-if="!currentFile" class="empty-state">
          <p>选择一个文件以查看或编辑内容</p>
        </div>
        <div v-else>
          <div class="file-header">
            <h2>{{ currentFile.fName }}</h2>
            <div class="file-actions">
              <button 
                v-if="!isEditing" 
                class="edit-button" 
                @click="startEditing"
                :disabled="!isEditableFile"
              >
                编辑
              </button>
              <button 
                v-else 
                class="save-button" 
                @click="saveContent"
              >
                保存
              </button>
              <button 
                v-if="isEditing" 
                class="cancel-button" 
                @click="cancelEditing"
              >
                取消
              </button>
              <span v-if="saveStatus" class="save-status success">{{ saveStatus }}</span>
              <span v-if="saveError" class="save-status error">{{ saveError }}</span>
              <button class="close-button" @click="closeFile" title="关闭文件">
                <span>×</span>
              </button>
            </div>
          </div>
          
          <div v-if="isLoadingContent" class="loading-state">
            <div class="spinner"></div>
            <span>加载内容中...</span>
          </div>
          <div v-else-if="contentError" class="error-message">
            {{ contentError }}
          </div>
          <div v-else>
            <!-- 编辑模式 -->
            <div v-if="isEditing" class="editor-container">
              <textarea 
                v-model="editableContent" 
                class="content-editor"
              ></textarea>
            </div>
            <!-- 预览模式 -->
            <div v-else class="markdown-content" v-html="renderedContent" @click="handleContentClick"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文件右键菜单 -->
    <div v-if="showContextMenu" class="context-menu" :style="contextMenuStyle">
      <div class="menu-item" @click="copyFileUrl">
        <span class="menu-icon">📋</span> 复制Markdown链接
      </div>
      <div class="menu-item" @click="openFile">
        <span class="menu-icon">📄</span> 打开文件
      </div>
      <div class="menu-item" @click="previewFileFromMenu">
        <span class="menu-icon">👁️</span> 预览文件
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { marked } from 'marked'; 
import FileTreeNode from '@/components/FileTreeNode.vue';
import Resizer from '@/components/Resizer.vue';
import authApi from '@/api/auth';

const store = useAuthStore();

// 编辑状态
const isEditing = ref(false);
const editableContent = ref('');
const saveStatus = ref('');
const saveError = ref('');

// 右键菜单状态
const showContextMenu = ref(false);
const contextMenuStyle = ref({
  top: '0px',
  left: '0px'
});
const selectedNode = ref(null);

// 预览状态
const previewFile = ref(null);
const previewContent = ref('');
const isLoadingPreview = ref(false);
const previewError = ref('');

// 面板宽度状态
const fileTreeWidth = ref(220); // 初始宽度
const previewPanelWidth = ref(300); // 初始宽度
const minWidth = 160; // 最小宽度
const maxTreeWidth = 400; // 文件树最大宽度
const maxPreviewWidth = 500; // 预览面板最大宽度

// 配置marked选项
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false,
  pedantic: false,
  sanitize: false,
  silent: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// 计算属性
const resourceTree = computed(() => store.resourceTree);
const currentFile = computed(() => store.currentFile);
const isLoadingTree = computed(() => store.isLoadingTree);
const isLoadingContent = computed(() => store.isLoadingContent);
const treeError = computed(() => store.treeError);
const contentError = computed(() => store.contentError);

// 判断是否为可编辑文件
const isEditableFile = computed(() => {
  if (!currentFile.value) return false;
  const extension = currentFile.value.fName.split('.').pop().toLowerCase();
  return ['md', 'txt', 'json', 'html', 'css', 'js', 'vue'].includes(extension);
});

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (!store.currentFileContent) return '';
  if (currentFile.value && currentFile.value.fName.toLowerCase().endsWith('.md')) {
    return marked(store.currentFileContent);
  }
  return `<pre>${store.currentFileContent}</pre>`;
});

// 渲染预览内容
const renderedPreviewContent = computed(() => {
  if (!previewContent.value) return '';
  if (previewFile.value && previewFile.value.fName.toLowerCase().endsWith('.md')) {
    return marked(previewContent.value);
  }
  return `<pre>${previewContent.value}</pre>`;
});

// 处理文件节点点击
const handleNodeClick = async (node) => {
  if (node.isDir) return; // 如果是目录，不进行操作
  
  // 如果正在编辑，提示用户保存或取消
  if (isEditing.value) {
    if (!confirm('你有未保存的更改，确定要切换文件吗？')) {
      return;
    }
    isEditing.value = false;
  }
  
  // 设置当前文件
  store.setCurrentFile(node);
  
  // 如果有URL，获取文件内容
  if (node.URL) {
    try {
      await store.fetchFileContent(node.URL);
    } catch (error) {
      console.error('获取文件内容失败', error);
    }
  }
};

// 处理文件节点右键点击
const handleNodeContextMenu = (data) => {
  // 显示右键菜单
  showContextMenu.value = true;
  selectedNode.value = data.node;
  
  // 设置菜单位置
  contextMenuStyle.value = {
    top: `${data.event.clientY}px`,
    left: `${data.event.clientX}px`
  };
};

// 复制文件URL到剪贴板
const copyFileUrl = () => {
  if (selectedNode.value && selectedNode.value.URL) {
    const fileUrl = selectedNode.value.URL;
    const fileName = selectedNode.value.fName;
    // 生成Markdown格式的链接
    const markdownLink = `[${fileName}](${fileUrl})`;
    
    navigator.clipboard.writeText(markdownLink)
      .then(() => {
        saveStatus.value = 'Markdown链接已复制到剪贴板';
        setTimeout(() => {
          saveStatus.value = '';
        }, 2000);
      })
      .catch(err => {
        console.error('复制失败: ', err);
        saveError.value = '复制链接失败';
        setTimeout(() => {
          saveError.value = '';
        }, 2000);
      });
  }
  closeContextMenu();
};

// 从右键菜单打开文件
const openFile = async () => {
  if (selectedNode.value) {
    await handleNodeClick(selectedNode.value);
  }
  closeContextMenu();
};

// 从右键菜单预览文件
const previewFileFromMenu = async () => {
  if (selectedNode.value) {
    await loadPreview(selectedNode.value);
  }
  closeContextMenu();
};

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
  selectedNode.value = null;
};

// 处理内容区域点击，用于链接预览
const handleContentClick = async (event) => {
  // 检查是否点击的是链接
  if (event.target.tagName === 'A') {
    event.preventDefault();
    const url = event.target.getAttribute('href');
    
    // 尝试在文件树中查找匹配的文件
    const file = findFileByUrl(url);
    if (file) {
      await loadPreview(file);
    } else {
      // 如果找不到文件，可以尝试直接加载URL内容
      previewFile.value = { fName: url.split('/').pop(), URL: url };
      await loadPreviewContent(url);
    }
  }
};

// 在文件树中查找匹配URL的文件
const findFileByUrl = (url) => {
  // 递归搜索函数
  const searchInTree = (nodes) => {
    if (!nodes) return null;
    
    for (const node of nodes) {
      if (!node.isDir && node.URL === url) {
        return node;
      }
      
      if (node.isDir && node.children) {
        const found = searchInTree(node.children);
        if (found) return found;
      }
    }
    
    return null;
  };
  
  return searchInTree(resourceTree.value);
};

// 加载预览文件
const loadPreview = async (file) => {
  previewFile.value = file;
  await loadPreviewContent(file.URL);
};

// 加载预览内容
const loadPreviewContent = async (url) => {
  isLoadingPreview.value = true;
  previewError.value = '';
  
  try {
    const response = await authApi.getFileContent(url);
    previewContent.value = response.data;
  } catch (error) {
    console.error('加载预览内容失败', error);
    previewError.value = `加载预览内容失败: ${error.message || '未知错误'}`;
    previewContent.value = '';
  } finally {
    isLoadingPreview.value = false;
  }
};

// 关闭预览
const closePreview = () => {
  previewFile.value = null;
  previewContent.value = '';
  previewError.value = '';
};

// 开始编辑文件
const startEditing = () => {
  editableContent.value = store.currentFileContent || '';
  isEditing.value = true;
  saveStatus.value = '';
  saveError.value = '';
};

// 保存文件内容
const saveContent = async () => {
  if (!currentFile.value || !currentFile.value.URL) {
    saveError.value = '无法保存文件：文件信息不完整';
    return;
  }
  
  try {
    saveStatus.value = '保存中...';
    // 使用API保存文件内容
    await authApi.saveFileContent(currentFile.value.URL, editableContent.value);
    
    // 更新store中的文件内容
    store.updateCurrentFileContent(editableContent.value);
    
    saveStatus.value = '保存成功';
    isEditing.value = false;
    
    // 3秒后清除状态信息
    setTimeout(() => {
      saveStatus.value = '';
    }, 3000);
  } catch (error) {
    console.error('保存文件失败', error);
    saveError.value = `保存失败：${error.message || '未知错误'}`;
    
    // 5秒后清除错误信息
    setTimeout(() => {
      saveError.value = '';
    }, 5000);
  }
};

// 取消编辑
const cancelEditing = () => {
  if (editableContent.value !== store.currentFileContent) {
    if (!confirm('确定要取消编辑？所有未保存的更改将丢失。')) {
      return;
    }
  }
  isEditing.value = false;
  editableContent.value = '';
  saveStatus.value = '';
  saveError.value = '';
};

// 关闭当前文件
const closeFile = () => {
  // 如果正在编辑，提示用户保存或取消
  if (isEditing.value) {
    if (!confirm('你有未保存的更改，确定要关闭文件吗？')) {
      return;
    }
    isEditing.value = false;
    editableContent.value = '';
  }
  
  store.closeCurrentFile();
};

// 全局点击事件，用于关闭右键菜单
const handleGlobalClick = () => {
  if (showContextMenu.value) {
    closeContextMenu();
  }
};

// 文件树缩放
const handleTreeResize = (deltaX) => {
  fileTreeWidth.value += deltaX;
  if (fileTreeWidth.value < minWidth) fileTreeWidth.value = minWidth;
  if (fileTreeWidth.value > maxTreeWidth) fileTreeWidth.value = maxTreeWidth;
};

// 预览面板缩放（修正为调整previewPanelWidth）
const handlePreviewResize = (deltaX) => {
  previewPanelWidth.value += deltaX;
  if (previewPanelWidth.value < minWidth) previewPanelWidth.value = minWidth;
  if (previewPanelWidth.value > maxPreviewWidth) previewPanelWidth.value = maxPreviewWidth;
};

// 挂载时添加全局点击事件监听
onMounted(async () => {
  document.addEventListener('click', handleGlobalClick);
  try {
    await store.fetchResourceTree();
  } catch (error) {
    console.error('获取资源树失败', error);
  }
});

// 卸载前移除事件监听
onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick);
});
</script>

<style scoped>
.workbench-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.workbench-layout {
  display: flex;
  height: calc(100% - 60px); /* 减去标题的高度 */
  position: relative; /* 让 Resizer 定位生效 */
}

.file-tree-panel {
  position: relative; /* 为 Resizer 提供定位上下文 */
  height: 100%;
  border-right: 1px solid #e0e0e0;
  padding: 15px;
  overflow-y: auto;
  background-color: #f9f9f9;
  flex-shrink: 0;
}

/* 预览面板样式 */
.preview-panel {
  position: relative; /* 为 Resizer 提供定位上下文 */
  height: 100%;
  border-right: 1px solid #e0e0e0;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 1;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f0f0f0;
}

.preview-title {
  overflow: hidden;
}

.preview-title h3 {
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-path {
  font-size: 12px;
  color: #666;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-close {
  margin-left: 10px;
}

.preview-content {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
}

.panel-title {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 500;
}

.file-content-panel {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 180px;
}

.menu-item {
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  padding: 15px;
  background-color: #fdecea;
  border-radius: 4px;
  margin: 10px 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50%;
  color: #666;
  font-style: italic;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.file-actions {
  display: flex;
  gap: 10px;
}

.edit-button, .save-button, .cancel-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button {
  background-color: #4caf50;
  color: white;
}

.edit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.save-button {
  background-color: #2196f3;
  color: white;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.edit-button:hover:not(:disabled) {
  background-color: #45a049;
}

.save-button:hover {
  background-color: #0b7dda;
}

.cancel-button:hover {
  background-color: #d32f2f;
}

.editor-container {
  height: calc(100vh - 250px);
}

.content-editor {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

.markdown-content {
  line-height: 1.6;
  color: #000000; /* 使用纯黑色提高对比度 */
  font-weight: normal;
}

/* 增强 Markdown 样式 */
.markdown-content :deep(h1) { font-size: 2em; margin-top: 0.67em; margin-bottom: 0.67em; font-weight: 700; color: #000000; }
.markdown-content :deep(h2) { font-size: 1.5em; margin-top: 0.83em; margin-bottom: 0.83em; font-weight: 700; color: #000000; }
.markdown-content :deep(h3) { font-size: 1.17em; margin-top: 1em; margin-bottom: 1em; font-weight: 600; color: #000000; }
.markdown-content :deep(p) { margin-top: 1em; margin-bottom: 1em; color: #000000; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left: 2em; color: #000000; }
.markdown-content :deep(li) { margin-bottom: 0.5em; color: #000000; }
.markdown-content :deep(code) { background-color: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; color: #d63384; font-weight: 500; }
.markdown-content :deep(pre) { background-color: #f4f4f4; padding: 1em; overflow-x: auto; color: #333; font-weight: normal; }
.markdown-content :deep(blockquote) { border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; color: #333; }
.markdown-content :deep(img) { max-width: 100%; }
.markdown-content :deep(a) { 
  color: #0d6efd; 
  text-decoration: underline; /* 将无下划线改为有下划线 */
  font-weight: 500; 
}
.markdown-content :deep(a):hover { 
  text-decoration: underline; 
  color: #0a58ca; /* 添加悬停时的颜色变化，使交互效果更明显 */
}
.markdown-content :deep(strong), .markdown-content :deep(b) { font-weight: 700; color: #000000; }
.markdown-content :deep(em), .markdown-content :deep(i) { font-style: italic; }

/* 表格样式 */
.markdown-content :deep(table) { 
  border-collapse: collapse; 
  width: 100%; 
  margin: 1em 0; 
  color: #000000;
}
.markdown-content :deep(th), .markdown-content :deep(td) { 
  border: 1px solid #ddd; 
  padding: 8px; 
  text-align: left; 
}
.markdown-content :deep(th) { 
  background-color: #f2f2f2; 
  font-weight: 600;
}
.markdown-content :deep(tr:nth-child(even)) { 
  background-color: #f8f8f8; 
}

/* 代码块样式增强 */
.markdown-content :deep(pre code) {
  display: block;
  padding: 1em;
  color: #333;
  font-weight: 400;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  line-height: 1.5;
}

.save-status {
  font-size: 14px;
  margin-left: 10px;
  padding: 4px 8px;
  border-radius: 4px;
}

.save-status.success {
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.save-status.error {
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
}

.close-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #666;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 10px;
}

.close-button:hover {
  background-color: #f44336;
  color: white;
  border-color: #f44336;
}

/* 修正Resizer在预览面板和右侧内容之间的显示层级 */
:deep(.resizer) {
  z-index: 2;
}
</style>
