<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<script type="text/javascript" src="../../../pageContext.js"></script>
</head>
<body  class="innerBody easyui-layout" data-options="fit:true">
	<div height="auto" data-options="region:'north',border:false,split:true" title=" ">
		<form id="conditionForm">
			<input id="processCode" name="processCode" type="hidden" />
		    <ul class="conditionUl" id="conditionUl">
		    	<li>
		    		<label>开始申请时间</label>
		    		<input name="requestDateForm" class="easyui-datebox" dataType="Date"/>
		    	</li>
		    	<li>
		    	    <label>至</label>
		    	    <input name="requestDateTo" class="easyui-datebox" dataType="Date"/>
		    	</li>
		    	<li>
		    		<label>状态</label>
		    		<input name="applyStatus" class="easyui-combobox" codeType="PROCESS_APPLY_STATUS"/>
	    		</li>
		    </ul>
		</form>	
	</div>	
	<div data-options="region:'center',border:false">
		<div class="easyui-layout" data-options="fit:true" >
			<div id="controlBtnList" data-options="region:'north',border:false" height="auto">
				<!-- 默认按钮default,回车默认触发 -->
				<a href="#" class="easyui-linkbutton" onclick="searchProcess()" default="default">查询</a>
				<a href="#" class="easyui-linkbutton" onclick="requestProcess()">发起申请</a>
				<a href="#" class="easyui-linkbutton" onclick="editRequestProcess()">修改申请</a>
			</div>
			<div data-options="region:'center',border:false">
				<table id="tbProcessRu"></table>
			</div>
		</div>
	</div>
	<div id="processTaskListDialog" class="easyui-dialog" style="width:650px;height:400px;" closed="true" title="任务列表">
			<table id="processTaskList" class="easyui-datagrid" data-options="checkbox:false" query="bean:fmxAllTaskQueryDataProvider">
				<thead>
					<tr>
						<th field="taskName" width="100">任务名称</th>
						<th field="assignee" width="80" codetype="UserAccount">审批人</th>
						<th field="createTime" width="90" formatter="datetime">创建日期</th>
						<th field="endTime" width="90" formatter="datetime">审批日期</th>
						<th field="vars" formatter="formatTaskVars">审批备注</th> 
					</tr>
				</thead>
			</table>
		</div>
	
	<div id="processImgDialog" class="easyui-dialog" style="width: 100%; height: 500px;" closed="true" title="流程图">
		<img id="processImg" alt="流程图" src="" />
	</div>
</body>
<script type="text/javascript">
var processCode;
var editProcessRuId = '';
$(document).ready(function() {
	processCode = "${processCode}"
	$('#processCode').val(processCode);
	loadFormColumnDetail();
});

var formColumnList;
var processFormInfo;
var candidateUsersObj;
function loadFormColumnDetail(){
	if(processCode != null && processCode != ''){
		$.post($url('/rest/fmxProcessFormRest/getFormDetailByProcessCode.json'),{
			processCode : processCode,
			taskCode : 'startEvent'
		},function(result){
			if (result.code == 0) {
				processFormInfo = result.data;
				if(result.data){
					if(result.data.columnList != null){
						formColumnList = result.data.columnList;
						var columnList = [{ field : "createdTime", formatter : loadRequestDetail, format : 'YYYY-MM-DD', title : "申请日期", width : 100 }];
						for(var i = 0; i < formColumnList.length; i++){
							var formColumn = formColumnList[i];
							if(formColumn.columnIsShow == 'Y'){
								var column;
								var columnAttr = result.data.attrList.filter(function (val, idx ){ return (val.columnId == formColumn.columnId && val.attrName == 'codetype') ? 1 : 0});
								if(columnAttr.length > 0){
									column = {field : formColumn.columnName, title : formColumn.columnLabel, codeType : columnAttr[0].attrValue};
								}else {
									column = {field : formColumn.columnName, title : formColumn.columnLabel};
								}
								columnList.push(column);
							}
						}
						columnList.push({field : "applyRemark", title : "申请备注", width : 300});
						columnList.push({field : "taskName", formatter : formatCurrentTask, title : "当前审批环节", width : 100});
						columnList.push({field : "dictCnName", formatter : formatProcessImage, title : "状态", width : 100 });
						loadDataGrid(columnList);
					}
					
					if(result.data.taskItem){
						candidateUsersObj = JSON.parse(result.data.taskItem.candidateUsers);
						if(candidateUsersObj){
							for(var i=0; i<candidateUsersObj.length;i++){
								var fieldValue = candidateUsersObj[i]['fieldValue'];
								if(top.pageContext[fieldValue]!=null){
									candidateUsersObj[i]['fieldValue'] = top.pageContext[fieldValue];
								}
							}
						}
					}
				}
			} else {
				var msg = result.message || '操作失败！';
				$.messager.alert("错误信息", msg,'error');
			}
		},'json');
	}
}

function loadDataGrid(columnList){
	$('#tbProcessRu').datagrid({
		fitColumns : false,
		paramForm : 'conditionForm',
		maskit : '#controlBtnList',
		query : 'bean:fmxProcessRequestListQueryDataProvider',
		columns : [columnList]});
}

function GetQueryString(str,LocString){
 	var rs=new RegExp("[/?&]"+str+"=([^&]*)(&|$)","gi").exec(LocString),tmp;
 	if(tmp=rs)return tmp[1];
 	return "";
}

function searchProcess(){
	$('#tbProcessRu').datagrid('reload');
}

function requestProcess(){
	if(processFormInfo != null){
		editProcessRuId = '';
		loadFormDetail(processFormInfo);
	}
}

function editRequestProcess(){
	var row = $('#tbProcessRu').datagrid('getSelected');
	if(row){
		if(row.applyStatus == '0' || row.applyStatus == '2'){
			loadFormDetail(processFormInfo);
			editProcessRuId = row.processRuId;
			loadProcessFormDetailForView(editProcessRuId);
		}else{
			$.messager.alert("提示信息", "只能修改草稿或审批驳回状态申请！",'warning');
		}
	}else{
		$.messager.alert("提示信息", "请选择需要操作的记录！",'warning');
	}
}

var $dlg;
var $button;
function loadFormDetail(formInfo){
	if($dlg != null)
		$dlg.detach();
	$dlg = $("<div style='display:none'><form id='fmForm' class='easyui-form' method='post' enctype='multipart/form-data' data-options='novalidate:true'><table id='tbForm' style='border-collapse:separate;border-spacing:0px 10px;vertical-align:middle;margin:0 15px;'></table></form></div>").appendTo("body");
	if($button != null)
		$button.detach();
	$button = $("<div id='dlg-btn-Request'><a href='#' class='easyui-linkbutton' onclick='saveRequest(false)' default>存为草稿</a><a href='#' class='easyui-linkbutton' onclick='saveRequest(true)' default>提交</a><a href='#' class='easyui-linkbutton' onclick='javascript:closeDialog()'>取消</a></div>").appendTo("body");
	$.parser.parse($button);
	
	$dlg.dialog({
		closed : true,
		title : formInfo.formTitle,
		width : formInfo.formWidth,
		height : formInfo.formHeight + 150,
		buttons : '#dlg-btn-Request'
	});
	
	var $tr;
	for(var index = 0; index < formInfo.columnList.length; index++){
		var column = formInfo.columnList[index];
		var $input = $('<input />');
		$input.attr('class',column.columnType);
		$input.attr('name',column.columnName);
		$input.attr('label',column.columnLabel);
		
		var newAttrList = formInfo.attrList.filter(function (val, idx ){ return val.columnName == column.columnName ? 1 : 0});
		var attrOptions = '';
		for(var i = 0; i < newAttrList.length; i++){
			var attr = newAttrList[i];
			if(attr.attrValue != null && attr.attrValue != ''){
				if('width' == attr.attrName || 'height' == attr.attrName){
					attrOptions += (attrOptions == '') ? (attr.attrName + ':' + attr.attrValue) : (',' + attr.attrName + ':' + attr.attrValue);
				}else if('value' == attr.attrName){
					if('Date' == attr.attrValue){
						var currentDate = moment().format('YYYY-MM-DD');
						$input.attr(attr.attrName, currentDate);
					}else if(top.fmx.pageContext.currentUser[attr.attrValue] != null){
						$input.attr(attr.attrName, top.fmx.pageContext.currentUser[attr.attrValue]);
					}else if(top.fmx.pageContext[attr.attrValue] != null){
						$input.attr(attr.attrName, top.fmx.pageContext[attr.attrValue]);
					}else{
						$input.attr(attr.attrName, attr.attrValue);
					}
				}else{
					$input.attr(attr.attrName, attr.attrValue);
				}
			}
		}
		if(attrOptions != ''){
			$input.attr('data-options', attrOptions);
		}
		var columnColspan = column.columnColspan == null ? 1 : Number(column.columnColspan);
		if(index == 0 || columnCount % Number(formInfo.formColumnCount) == 0){
			$tr = $('<tr></tr>'); 
			$tr.appendTo($('#tbForm'));
			columnCount = 0;
		}
		columnCount += columnColspan;
		var $td = $('<td></td>');
		$td.attr('style', 'text-align:left');
		if(columnColspan > 0){
			$td.attr('colspan', columnColspan);
		}
		$input.appendTo($td);
		$td.appendTo($tr);
	}
	var $approveUserTr = $('<tr><td><input id="approveUser" label="审批人" name="approveUser" class="easyui-combogrid" codetype="ApproveUserList"/></td></tr>');
	$approveUserTr.appendTo($('#tbForm'));
	var $remarkTr = $('<tr><td colspan=' + formInfo.formColumnCount + ' style="text-align:left"><label>申请备注</label></td></tr><tr><td colspan=' + formInfo.formColumnCount + '><input id="applyRemark" name="applyRemark" class="easyui-textbox" multiline="true" style="width:100%;height:80px" /></td></tr>')
	$remarkTr.appendTo($('#tbForm'));
	
	$.parser.parse($dlg);
	$dlg.dialog("open");
	
	setTimeout(function(){
		$('#approveUser').combogrid('grid').datagrid('options').queryFields = candidateUsersObj;
		$('#approveUser').combogrid('grid').datagrid('reload');
	},2000);
}

function closeDialog(){
	if($dlg != null){
		$dlg.dialog("close");
	}
}

function saveRequest(saveType){
	var data=$('#fmForm').form('getData');
	var detailModels = [];
	for(var key in data){
		var detail = {};
		detail.processColumnName = key;
		detail.processColumnValue = data[key];
		
		var currentColumn = formColumnList.filter(function (val, idx ){ return val.columnName == key ? 1 : 0});
		if(currentColumn.length > 0){
			var currentColumnType = currentColumn[0]['columnType'];
			switch(currentColumnType){
				case 'easyui-datebox':
					detail.processColumnType = 'java.util.Date';
			  		break;
				case 'easyui-numberbox':
					detail.processColumnType = 'java.lang.Integer';
			  		break;
				default:
					detail.processColumnType = 'java.lang.String';
			}
			detailModels.push(detail);
		}
	};
	$('#dlg-btn-Request').maskit();
	var applyRemark = $('#applyRemark').textbox('getValue');
	var approveUser = $('#approveUser').combogrid('getValue');
	$postJSON($url('/rest/fmxProcessRuFormRest/saveRequestDetail.json?processRuId='+editProcessRuId+'&processCode='+processCode+'&applyRemark='+applyRemark+'&saveType='+saveType+'&approveUser='+approveUser),detailModels,function(result){
		$('#dlg-btn-Request').maskit('unmask');
		if (result.code == 0) {
			closeDialog();
			$('#dlgRequest').dialog('close');
			searchProcess();
			$.messager.show({title:'Message',msg:'申请成功！',timeout:5000,showType:'slide'});
		} else {
			var msg = result.message || '操作失败！';
			$.messager.alert("错误信息", msg,'error');
		}
	},'json');
}

function formatCurrentTask(value,rowData,index) {
	var instId,text = "已完成";
	if(rowData.processInstanceId){
		if(rowData.taskName) text = rowData.taskName;
		return "<a href='javascript:void(0)' onclick='showLeaveTasks(\""+rowData.processInstanceId+"\");'>"+text+"</a>";
	}else{
		return "未启动";
	}
}

function showLeaveTasks(instId) {
	$('#processTaskList').datagrid('commonQuery',{
		queryFields : [{fieldName:"instanceId",fieldValue:instId}]
	});
	$('#processTaskListDialog').dialog('open');
}

function formatTaskVars(value,rowData,index) {
	if($.isPlainObject(value)){
		return value.approveRemark;
	}
	return value;
}

function formatProcessImage(value, rowData, index) {
	if(rowData.processInstanceId != null && rowData.processInstanceId != ''){
		return "<a href='javascript:void(0)' onclick='showProcessImage(\""+rowData.processInstanceId+"\");'>"+value+"</a>";
	}else{
		return value;
	}
}

function showProcessImage(instId) {
	var url = $url('/rest/activitiRest/showProcessImage.json?processInstanceId='+instId);
	$('#processImg').attr('src',url);
	$('#processImgDialog').dialog('open');			
}

function loadRequestDetail(value,rowData,index){
	if(rowData.processRuId != null && rowData.processRuId != ''){
		return "<a href='javascript:void(0)' onclick='loadProcessFormForView(\""+rowData.processCode+"\",\""+rowData.processRuId+"\");'>"+moment(value).format('YYYY-MM-DD')+"</a>";
	}else{
		return moment(value).format('YYYY-MM-DD');
	}
}

function loadProcessFormForView(processCode, processRuId){
	if(processCode != null && processCode != ''){
		$.post($url('/rest/fmxProcessFormRest/getFormDetailByProcessCode.json'),{
			processCode : processCode
		},function(result){
			if (result.code == 0) {
				loadFormDetailForView(result.data, processRuId);
			} else {
				var msg = result.message || '操作失败！';
				$.messager.alert("错误信息", msg,'error');
			}
		},'json');
	}
}

function loadProcessFormDetailForView(processRuId){
	if(processCode != null && processCode != ''){
		$.post($url('/rest/fmxProcessRuFormDetailRest/getDetailByProcessRuId.json'),{
			processRuId : processRuId
		},function(result){
			if (result.code == 0) {
				var data = result.data;
				var detail = {};
				for(var i=0; i< data.length; i++){
					for(var key in data[i]){
						detail[data[i].processColumnName] = data[i].processColumnValue;
					}
				}
				$('#fmForm').form('load', detail);
			} else {
				var msg = result.message || '操作失败！';
				$.messager.alert("错误信息", msg,'error');
			}
		},'json');
	}
}

function loadFormDetailForView(formInfo, processRuId){
	if($dlg != null)
		$dlg.detach();
	$dlg = $("<div style='display:none'><form id='fmForm' class='easyui-form' method='post' enctype='multipart/form-data' data-options='novalidate:true'><table id='tbForm' style='border-collapse:separate;border-spacing:0px 10px;vertical-align:middle;margin:0 15px;'></table></form></div>").appendTo("body");
	if($button != null)
		$button.detach();
	$button = $("<div id='dlg-btn-Request'><a href='#' class='easyui-linkbutton' onclick='javascript:closeDialog()'>关闭</a></div>").appendTo("body");
	$.parser.parse($button);
	$dlg.dialog({
		closed : true,
		title : formInfo.formTitle + '-查看',
		width : formInfo.formWidth,
		height : formInfo.formHeight,
		buttons : '#dlg-btn-Request'
	});
	
	var $tr;
	for(var index = 0; index < formInfo.columnList.length; index++){
		var column = formInfo.columnList[index];
		var $input = $('<input />');
		$input.attr('class',column.columnType);
		$input.attr('name',column.columnName);
		$input.attr('label',column.columnLabel);
		$input.attr('readonly', true);
		
		var newAttrList = formInfo.attrList.filter(function (val, idx ){ return val.columnName == column.columnName ? 1 : 0});
		var attrOptions = '';
		for(var i = 0; i < newAttrList.length; i++){
			var attr = newAttrList[i];
			if(attr.attrValue != null && attr.attrValue != ''){
				if('width' == attr.attrName || 'height' == attr.attrName){
					attrOptions = attrOptions == '' ? (attr.attrName + ':' + attr.attrValue) : (',' + attr.attrName + ':' + attr.attrValue);
				}else{
					$input.attr(attr.attrName, attr.attrValue);
				}
			}
		}
		if(attrOptions != ''){
			$input.attr('data-options', attrOptions);
		}
		
		var columnColspan = column.columnColspan == null ? 1 : Number(column.columnColspan);
		if(index == 0 || columnCount % Number(formInfo.formColumnCount) == 0){
			$tr = $('<tr></tr>'); 
			$tr.appendTo($('#tbForm'));
			columnCount = 0;
		}
		columnCount += columnColspan;
		var $td = $('<td></td>');
		$td.attr('style', 'text-align:left');
		if(columnColspan > 0){
			$td.attr('colspan', columnColspan);
		}
		$input.appendTo($td);
		$td.appendTo($tr);
	}
	
	$.parser.parse($dlg);
	$dlg.dialog("open");
	loadProcessFormDetailForView(processRuId);
}
</script>
</html>