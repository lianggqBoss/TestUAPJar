/**
 * @author Fanxy
 */

$(document).ready(function(){
	$.extend(true,$("#dictionariesType").datagrid("options"),{
		onCheck:function(index, row){
	    	var dictCode = row["dictTypeCode"],dict = $("#dictionaries");
	    	var options = dict.datagrid("options");
	    	options.queryFields = [{fieldName:'parentCode',fieldStringValue:dictCode,fieldType:'String'}];
	    	dict.datagrid('reload');
		}
	});
})

function LoadTypeData(){
	$("#dictionariesType").datagrid('reload');
	$('#dictionaries').datagrid('loadData', { total: 0, rows: [] });
}

function newDictType(){
	$('#eDictTypeCode').textbox('textbox').attr('readonly',false);
	$('#dlgDictType').dialog('open').dialog('setTitle','新增数据字典类型');
	$("#fmType").form('clear');
}

function editDictType(){
	$('#eDictTypeCode').textbox('textbox').attr('readonly',true);
	var row = $('#dictionariesType').datagrid('getSelected');
	if (row){
		$('#dlgDictType').dialog('open').dialog('setTitle','修改数据字典类型');
		$("#fmType").form('load',row);
	}else{
		$.messager.alert("提示信息", "请选择需要操作的记录！",'warning');
	}
}
function saveDictType(){
	var url = $url('/rest/fmxDictTypeRest/save.json');
	$('#fmType').form('submit', {
  		contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
  		url : url,
  		onSubmit : function() {
  			return $(this).form('enableValidation').form('validate');
  		},
  		success : function(result) {
  			var data=JSON.parse(result);
  			if(data.code>=0){
  				$.messager.show({title:'提示信息',msg:'数据字典类型保存成功！',timeout:5000,showType:'slide'});
                $("#dlgDictType").dialog("close");
                LoadTypeData();
        	}else{
        		var msg = data.message || '操作失败！';
				$.messager.alert("错误信息", msg,'error');
        	}
  		}
	});
}
function newDict(){
	var row=$('#dictionariesType').datagrid('getSelected');
	if(row){
		$('#dlgDict').dialog('open').dialog('setTitle','新增数据字典');
		$('#eDictCode').textbox('textbox').attr('readonly',false);
		$("#fm").form('clear');
		$("#eParentCode").val(row.dictTypeCode);
	}else{
		$.messager.alert("提示信息", "请先选中需要增加字典的字典类型！",'warning');
	}	
}
function editDict(){
	$('#eDictCode').textbox('textbox').attr('readonly',true);
	var row = $('#dictionaries').datagrid('getSelected');
	if (row){
		$('#dlgDict').dialog('open').dialog('setTitle','修改数据字典');
		$("#fm").form('load',row);
	}else{
		$.messager.alert("提示信息", "请选择需要操作的记录！",'warning');
	}
}

function saveDict(){
	var url = $url('/rest/fmxDictRest/save.json');
	$('#fm').form('submit', {
  		contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
  		url : url,
  		onSubmit : function() {
  			return $(this).form('enableValidation').form('validate');
  		},
  		success : function(result) {
  			var data=JSON.parse(result);
  			if(data.code>=0){
  				$.messager.show({title:'提示信息',msg:'数据字典保存成功！',timeout:5000,showType:'slide'});
                $("#dlgDict").dialog("close");
            	$("#dictionaries").datagrid('reload');
        	}else{
        		var msg = data.message || '操作失败！';
				$.messager.alert("错误信息", msg,'error');
        	}
  		}
	});
}

function deleteDictType(){
	var row = $('#dictionariesType').datagrid('getSelected');
	if(row==null){
		$.messager.alert("提示信息", "请选择需要操作的记录！",'warning');
	}else{
		$.messager.confirm('删除数据字典类型', '确定删除选中的数据字典类型？', function(retn){
			if (retn){
				$('#dictControl').maskit();
				$.post($url('/rest/fmxDictTypeRest/delete.json'), {
					dictTypeId : row.dictTypeId
  				}, function(result) {
  					$('#dictControl').maskit('unmask');
					if (result.code == 0) {
		  				$.messager.show({title:'提示信息',msg:'数据字典类型删除成功！',timeout:5000,showType:'slide'});
						LoadTypeData();
  					} else {
  						var msg = result.message || '操作失败！';
  						$.messager.alert("错误信息", msg,'error');
  					}
  				}, 'json');
			}
		});
	}	
}

function deleteDict(){
	var row = $('#dictionaries').datagrid('getSelected');
	if(row==null){
		$.messager.alert("提示信息", "请选择需要操作的记录！",'warning');
	}else{
		$.messager.confirm('删除数据字典', '确定删除选中的数据字典？', function(retn){
			if (retn){
				$('#dictControl').maskit();
				$.post($url('/rest/fmxDictRest/delete.json'), {
					dictId : row.dictId
  				}, function(result) {
  					$('#dictControl').maskit('unmask');
					if (result.code == 0) {
		  				$.messager.show({title:'提示信息',msg:'数据字典删除成功！',timeout:5000,showType:'slide'});
		        		$("#dictionaries").datagrid('reload');
  					} else {
  						var msg = result.message || '操作失败！';
  						$.messager.alert("错误信息", msg,'error');
  					}
  				}, 'json');
			}
		});
	}
}
 