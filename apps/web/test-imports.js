// 测试所有 shadcn 组件导入
console.log('测试组件导入...');

try {
  const { Button } = require('./src/components/ui/button.tsx');
  console.log('✅ Button 组件导入成功');
} catch (e) {
  console.log('❌ Button 导入失败:', e.message);
}

try {
  const { Input } = require('./src/components/ui/input.tsx');
  console.log('✅ Input 组件导入成功');
} catch (e) {
  console.log('❌ Input 导入失败:', e.message);
}

try {
  const { Tabs } = require('./src/components/ui/tabs.tsx');
  console.log('✅ Tabs 组件导入成功');
} catch (e) {
  console.log('❌ Tabs 导入失败:', e.message);
}

try {
  const { Card } = require('./src/components/ui/card.tsx');
  console.log('✅ Card 组件导入成功');
} catch (e) {
  console.log('❌ Card 导入失败:', e.message);
}

console.log('\n所有组件导入测试完成！');
