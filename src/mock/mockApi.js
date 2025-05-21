import { resourceTreeData } from './resourceTree';

// 模拟文件内容映射
const fileContents = {
  '/mock/files/vue-notes.md': () => import('./files/vue-notes.md?raw'),
  '/mock/files/readme.md': () => import('./files/readme.md?raw'),
  '/mock/files/react-basics.md': () => Promise.resolve('# React 基础\n\nReact 是一个用于构建用户界面的 JavaScript 库。'),
  '/mock/files/async-js.md': () => Promise.resolve('# JavaScript 异步编程\n\n## Promise\n\nPromise 是现代 JavaScript 中处理异步操作的标准方式。'),
  '/mock/files/functional-js.md': () => Promise.resolve('# JavaScript 函数式编程\n\n函数式编程是一种编程范式，它将计算视为数学函数的求值。'),
  '/mock/files/project-planning.md': () => Promise.resolve('# 项目规划\n\n## 开发时间线\n\n- 第一阶段：需求分析和设计\n- 第二阶段：核心功能开发\n- 第三阶段：测试和优化'),
  '/mock/files/api-docs.md': () => Promise.resolve('# API 文档\n\n## 用户认证\n\n- POST /api/auth/login\n- POST /api/auth/register\n\n## 资源管理\n\n- GET /api/resource/tree')
};

// 模拟延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟API
export const mockApi = {
  // 获取资源树
  async getResourceTree() {
    // 模拟网络延迟
    await delay(800);
    
    // 模拟成功响应
    return {
      data: resourceTreeData,
      status: 200
    };
  },
  
  // 获取文件内容
  async getFileContent(url) {
    // 模拟网络延迟
    await delay(500);
    
    // 检查URL是否存在于我们的映射中
    if (fileContents[url]) {
      try {
        // 获取文件内容
        const content = await fileContents[url]();
        
        // 如果是导入的模块，需要获取default
        const fileContent = content.default || content;
        
        return {
          data: fileContent,
          status: 200
        };
      } catch (error) {
        console.error('Error loading mock file:', error);
        throw { response: { status: 500, data: 'Error loading file' } };
      }
    } else {
      // 模拟404错误
      throw { 
        response: { 
          status: 404, 
          data: `File not found: ${url}` 
        } 
      };
    }
  }
};
