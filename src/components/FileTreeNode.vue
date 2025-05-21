<template>
  <div class="file-node">
    <div 
      class="node-content" 
      @click="handleNodeClick"
      :class="{ 
        'is-folder': node.isDir, 
        'is-file': !node.isDir
      }"
    >
      <!-- 文件/文件夹图标 -->
      <span class="icon">
        <i v-if="node.isDir" :class="expanded ? 'folder-open' : 'folder'"></i>
        <i v-else :class="getFileIcon(node.fName)"></i>
      </span>
      
      <!-- 文件/文件夹名称 -->
      <span class="name">{{ node.fName }}</span>
    </div>
    
    <!-- 子节点，仅在文件夹被展开时显示 -->
    <div v-if="node.isDir && expanded && node.children?.length" class="children">
      <file-tree-node
        v-for="child in node.children"
        :key="child.fid"
        :node="child"
        @node-click="onChildClick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['node-click']);

// 控制文件夹展开/收起状态
const expanded = ref(false);

// 处理节点点击事件
const handleNodeClick = () => {
  // 如果是文件夹，切换展开状态
  if (props.node.isDir) {
    expanded.value = !expanded.value;
  }
  
  // 触发点击事件，传递节点信息
  emit('node-click', props.node);
};

// 从子节点传递点击事件
const onChildClick = (node) => {
  emit('node-click', node);
};

// 根据文件名获取对应的图标类名
const getFileIcon = (fileName) => {
  if (fileName.endsWith('.md')) return 'file-md';
  if (fileName.endsWith('.pdf')) return 'file-pdf';
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'file-doc';
  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'file-xls';
  if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'file-ppt';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) return 'file-img';
  return 'file-default';
};
</script>

<style scoped>
.file-node {
  margin: 2px 0;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.node-content:hover {
  background-color: #eee;
}

.is-folder {
  font-weight: 500;
}

.is-file.node-content:hover {
  background-color: #e3f2fd;
}

.icon {
  margin-right: 8px;
  width: 16px;
  text-align: center;
  font-size: 18px;
}

.name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.children {
  padding-left: 24px;
  margin-top: 2px;
}

/* 图标样式 */
.folder::before {
  content: "📁";
}

.folder-open::before {
  content: "📂";
}

.file-md::before {
  content: "📄";
}

.file-pdf::before {
  content: "📑";
}

.file-doc::before {
  content: "📝";
}

.file-xls::before {
  content: "📊";
}

.file-ppt::before {
  content: "📽️";
}

.file-img::before {
  content: "🖼️";
}

.file-default::before {
  content: "📎";
}
</style>
