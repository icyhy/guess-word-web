class ChineseCheatDetector {
  constructor() {
    // 中文同义词映射
    this.synonyms = {
      '电脑': ['计算机', '机器', '设备'],
      '电话': ['手机', '手机', '通讯设备', '电话'],
      '水': ['H2O', '液体', '饮品'],
      '太阳': ['阳光', '恒星', '光明'],
      '树': ['植物', '木', '绿化'],
      '狗': ['犬', '宠物', '小狗'],
      '猫': ['猫咪', '宠物', '小猫'],
      '房子': ['家', '建筑物', '住宅'],
      '书本': ['书籍', '小说', '文献'],
      '苹果': ['水果', '红苹果', '青苹果'],
      '汽车': ['车', '轿车', '车辆'],
      '香蕉': ['水果', '黄色水果'],
      '老师': ['教师', '导师', '教书'],
      '学生': ['学员', '学习者', '读书人'],
      '朋友': ['好友', '伙伴', '知己'],
      '家庭': ['家人', '亲属', '家属'],
      '时间': ['时刻', '时光', '时候'],
      '音乐': ['歌曲', '乐曲', '音响'],
      '食物': ['食品', '饭菜', '吃食'],
      '饮料': ['饮品', '水', '液体'],
      '衣服': ['服装', '衣物', '服饰'],
      '工作': ['职业', '上班', '任务'],
      '快乐': ['开心', '高兴', '愉悦'],
      '悲伤': ['难过', '伤心', '悲痛'],
      '大': ['巨大', '庞大', '很大'],
      '小': ['微小', '细小', '很小'],
      '热': ['炎热', '烫', '高温'],
      '冷': ['寒冷', '凉', '低温'],
      '快': ['快速', '迅速', '急速'],
      '慢': ['缓慢', '慢慢', '迟缓'],
      '上': ['上方', '上面', '向上'],
      '下': ['下方', '下面', '向下'],
      '左': ['左边', '左侧', '左方'],
      '右': ['右边', '右侧', '右方'],
      '前': ['前方', '前面', '朝前'],
      '后': ['后面', '后方', '朝后'],
      '学校': ['学院', '学堂', '教育机构'],
      '医院': ['诊所', '医务所', '医疗机构'],
      '餐厅': ['饭店', '餐馆', '食府'],
      '公园': ['花园', '乐园', '休憩场所'],
      '城市': ['都市', '都会', '市区'],
      '国家': ['国度', '国家', '国'],
      '世界': ['天下', '全球', '宇宙'],
      '语言': ['言语', '话语', '言辞'],
      '艺术': ['美术', '技艺', '文艺'],
      '科学': ['科研', '科学', '理科'],
      '数学': ['算术', '数学', '算学'],
      '历史': ['历史', '史记', '过往'],
      '地理': ['地理', '地貌', '地形'],
      '体育': ['运动', '体育', '健身'],
      '游戏': ['游玩', '游戏', '娱乐'],
      '电影': ['影片', '电影', '影剧'],
      '音乐家': ['乐师', '音乐人', '作曲家'],
      '演员': ['艺人', '表演者', '戏子'],
      '医生': ['大夫', '医师', '医生'],
      '工程师': ['技师', '工程师', '技工'],
      '厨师': ['炊事员', '大厨', '烹饪师'],
      '艺术家': ['艺者', '画家', '创作者'],
      '作家': ['文人', '写手', '文学家'],
      '歌手': ['歌者', '歌唱家', '演唱者'],
      '舞者': ['舞人', '舞蹈家', '跳舞者'],
      '运动员': ['选手', '体育健儿', '运动员'],
      '早餐': ['早饭', '早点', '晨餐'],
      '午餐': ['午饭', '午膳', '中餐'],
      '晚餐': ['晚饭', '晚膳', '夜宵'],
      '面包': ['面包', '面饼', '麦饼'],
      '牛奶': ['牛乳', '乳汁', '奶'],
      '鸡蛋': ['蛋', '鸡子', '卵'],
      '米饭': ['白饭', '米粒', '饭'],
      '面条': ['面', '面条', '面食'],
      '汤': ['羹', '汤水', '汁'],
      '沙拉': ['沙律', '凉拌', '生菜'],
      '披萨': ['比萨', '披萨', '意式薄饼'],
      '汉堡': ['汉堡包', '汉堡', '汉包']
    };
  }

  /**
   * 检测描述中是否包含目标单词或其变体
   * @param {string} originalWord - 原始单词
   * @param {string} description - 用户描述
   * @returns {boolean} - 是否检测到作弊
   */
  detect(originalWord, description) {
    if (!originalWord || !description) {
      return false;
    }

    const normalizedOriginal = this.normalize(originalWord);
    const normalizedDescription = this.normalize(description);

    // 直接匹配
    if (normalizedDescription.includes(normalizedOriginal)) {
      return true;
    }

    // 检查同义词
    const synonyms = this.synonyms[normalizedOriginal] || [];
    for (const synonym of synonyms) {
      if (normalizedDescription.includes(synonym)) {
        return true;
      }
    }

    // 检查反向同义词（描述中的词的同义词是否包含原词）
    for (const [word, wordSynonyms] of Object.entries(this.synonyms)) {
      if (normalizedDescription.includes(word) || wordSynonyms.some(s => normalizedDescription.includes(s))) {
        if (word === normalizedOriginal || wordSynonyms.includes(normalizedOriginal)) {
          return true;
        }
      }
    }

    // 检查拼写相似性（简单编辑距离）
    const wordsInDescription = normalizedDescription.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    for (const word of wordsInDescription) {
      if (this.calculateSimilarity(normalizedOriginal, word) > 0.8) {
        return true;
      }
    }

    return false;
  }

  /**
   * 标准化文本
   * @param {string} text - 输入文本
   * @returns {string} - 标准化后的文本
   */
  normalize(text) {
    return text
      .replace(/[^\u4e00-\u9fa5\w\s]/g, '')  // 移除标点符号，保留中文、字母和数字
      .trim();
  }

  /**
   * 计算两个字符串的相似度
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} - 相似度 (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;

    // 使用编辑距离计算相似度
    const distance = this.editDistance(str1, str2);
    return (longer.length - distance) / longer.length;
  }

  /**
   * 计算编辑距离
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} - 编辑距离
   */
  editDistance(str1, str2) {
    const matrix = [];

    // 初始化矩阵
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // 填充矩阵
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,  // 替换
            matrix[i][j - 1] + 1,      // 插入
            matrix[i - 1][j] + 1       // 删除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

module.exports = ChineseCheatDetector;