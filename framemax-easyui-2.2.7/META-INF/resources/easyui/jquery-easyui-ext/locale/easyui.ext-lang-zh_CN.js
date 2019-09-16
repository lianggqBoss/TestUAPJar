$.fn.datagrid.defaults.refreshText = "刷新";
$.fn.datagrid.defaults.resetSortText = "默认排序";
$.fn.datagrid.defaults.exportExcelCurrentPageText = "导出Excel (当前页)";
$.fn.datagrid.defaults.exportExcelAllText = "导出Excel (全部)";
$.fn.datagrid.defaults.showColumnsText = "显示列";
$.fn.datagrid.defaults.exportExcelErrorMsg = "当前表格不支持导出Excel";
$.fn.datagrid.defaults.dataChangedMsg = "数据已修改。是否舍弃？";
$.fn.datagrid.defaults.loadDataErrorMsg = "加载数据错误。";
$.fn.datagrid.defaults.reLoginMsg = "Failed to load data, please login again and retry.";
$.fn.form.defaults.submittingMsg = "表单正在提交,请稍候。";

$.fn.panel.defaults.setDefaultContextErrorMsg = "框架检测到页面使用了jQuery selector，但无法定位 '$(function(){...})'，所以未能设置默认context，请修改页面代码！";
$.fn.panel.defaults.reLoginMsg = "Your session has expired, Please login again.";

if ($.fn.validatebox){
	$.fn.validatebox.defaults.rules.minLength.message="输入最小长度限制为{0},请重新输入!";
}

if ($.fn.validatebox){
	$.fn.validatebox.defaults.rules.maxLength.message="输入最大长度限制为{0},请重新输入!";
}

if($.fn.filebox) {
	$.fn.filebox.defaults.buttonText="选择文件";
}