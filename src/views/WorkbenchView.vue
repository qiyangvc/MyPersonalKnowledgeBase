<template>
  <div class="workbench-container">
    <h1>学习工作台</h1>
    
    <!-- 分为左右两部分的布局 -->
    <div class="workbench-layout">
      <!-- 左侧文件树 -->
      <div class="file-tree-panel">
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
          />
        </div>
      </div>
      
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
            <div v-else class="markdown-content" v-html="renderedContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { marked } from 'marked'; 
import FileTreeNode from '@/components/FileTreeNode.vue';
import authApi from '@/api/auth';

const store = useAuthStore();

// 编辑状态
const isEditing = ref(false);
const editableContent = ref('');
const saveStatus = ref('');
const saveError = ref('');

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

// 组件挂载时获取资源树
onMounted(async () => {
  try {
    await store.fetchResourceTree();
  } catch (error) {
    console.error('获取资源树失败', error);
  }
});
</script>

<style scoped>
.workbench-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.workbench-layout {
  display: flex;
  height: calc(100% - 60px); /* 减去标题的高度 */
}

.file-tree-panel {
  width: 280px;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  padding: 15px;
  overflow-y: auto;
  background-color: #f9f9f9;
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
.markdown-content :deep(a) { color: #0d6efd; text-decoration: none; font-weight: 500; }
.markdown-content :deep(a):hover { text-decoration: underline; }
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
</style>
