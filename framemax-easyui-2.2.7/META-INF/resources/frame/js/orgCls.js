/**
 * 保存成员节点信息
 */
var rowData = [];
/*
 * 绑定单机事件，默认选中第一行
 */
$(function() {
	$.extend(true, $("#tbOrgCls").datagrid("options"), {
		onSelect : function(index, row) {
			var targetId = row["orgClsId"];
			LoadTree(targetId);
		},
		onLoadSuccess : function(data) {
			if (data.rows.length > 0) {
				$('#tbOrgCls').datagrid("selectRow", 0);
			}
		}
	});
	$.extend(true, $("#deptOrgTree").tree("options"), {
		onSelect : function(node) {
			if (node != null)
				LoadOrgClsMember(node.id);
		},
		onDrop : function(target, source, point) {
			var row = $('#tbOrgCls').datagrid('getSelected');
			if (row) {
				var parentID = $("#deptOrgTree").tree("getNode", target).id;
				var sysVersion = source.sysVersion;
				if(!sysVersion && source.attributes && source.attributes.data) {
					sysVersion = source.attributes.data.sysVersion;
				}
				var jsonVar = {
					"orgClsId" : row.orgClsId,
					"orgId" : source.id,
					"orgName" : source.text,
					"orgParentId" : parentID,
					"sysVersion" : sysVersion,
					"point" : point
				};
				$.ajax({
					type : "POST",
					dataType : "json",
					url : $url('/rest/fmxOrgRest/save.json'),
					data : jsonVar,
					success : function(data) {
						if (data.code < 0) {
							var msg = data.message || '操作失败！';
							$.messager.alert("错误信息", msg, 'error');
						}
					}
				});
			}
		}
	});
	$.extend(true, $("#tbOrgClsMember").datagrid("options"), {
		onSelect : function(index, row) {
			checkData(row, 1);
		},
		onUnselect : function(index, row) {
			checkData(row, 0);
		},
		onSelectAll : function(rows) {
			for (var i = 0; i < rows.length; i++) {
				checkData(rows[i], 1);
			}
		},
		onUnselectAll : function(rows) {
			for (var i = 0; i < rows.length; i++) {
				checkData(rows[i], 0);
			}
		}
	});
})
function doSearch() {
	$("#tbOrgClsMember").datagrid("reload");
}
function checkData(row, tagVar) {
	var selectData = {
		"checked" : tagVar,
		"empId" : row.empId,
		"orgMemberId" : row.orgMemberId,
		"orgId" : row.orgId
	};
	var rowFlag = false;
	for (var i = 0; i < rowData.length; i++) {
		if (row.empId == rowData[i].empId
				&& row.orgMemberId == rowData[i].orgMemberId) {
			rowData[i].checked = tagVar;
			rowFlag = true;
		}
	}
	if (!rowFlag) {
		rowData.push(selectData);
	}
}

/*
 * 根据条件搜索
 */
function searchOrgCls() {
	$("#tbOrgCls").datagrid('reload');
	$('#tbOrgClsMember').datagrid('loadData', {
		total : 0,
		rows : []
	});
	$("#searchName").searchbox('clear');
}

/*
 * 新增按钮
 */
function newClsCode() {
	$('#dlgOrgCls').dialog('open').dialog('setTitle', '新增类型');
	$('#eOrgClsCode').textbox('textbox').attr('readonly', false);
	$('#fmOrgCls').form('clear');
}

/*
 * 修改按钮
 */
function editClsCode() {
	var row = $('#tbOrgCls').datagrid('getSelected');
	if (row) {
		$('#dlgOrgCls').dialog('open').dialog('setTitle', '修改类型');
		$('#eOrgClsCode').textbox('textbox').attr('readonly', true);
		$('#fmOrgCls').form('load', row);
	} else {
		$.messager.alert("提示信息", "请选择需要操作的记录！", 'warning');
	}
}

/*
 * 导入树
 */
function LoadTree(orgClsid) {
	var orgTree = $("#deptOrgTree");
	var options = orgTree.tree("options");
	options.queryFields = [ {
		fieldName : 'orgClsId',
		fieldStringValue : orgClsid,
		fieldType : 'long'
	} ];
	orgTree.tree('reload');
}

/*
 * 导入成员表
 */
function LoadOrgClsMember(orgClsid) {
	if (orgClsid != null) {
		var row = $('#tbOrgCls').datagrid('getSelected');
		if (row) {
			var orgMember = $("#tbOrgClsMember");
			var options = orgMember.datagrid("options");
			options.queryFields = [ {
				fieldName : 'orgId',
				fieldStringValue : orgClsid,
				fieldType : 'long'
			} ];
			orgMember.datagrid('reload');
		}
	} else {
		$('#tbOrgClsMember').datagrid('loadData', {
			total : 0,
			rows : []
		});
	}
}

function LoadMember() {
	var node = $('#deptOrgTree').tree('getSelected');
	if (node != null) {
		var empID = $("#empId").combogrid("getValue");
		var empStartFrom = $("#empStartDateFrom").datebox("getValue");
		var empStartEnd = $("#empStartDateEnd").datebox("getValue");
		var orgMember = $("#tbOrgClsMember");
		var options = orgMember.datagrid("options");
		options.queryFields = [ {
			fieldName : 'orgId',
			fieldStringValue : node.id,
			fieldType : 'long'
		}, {
			fieldName : 'empID',
			fieldStringValue : empID,
			fieldType : 'long'
		}, {
			fieldName : 'empStartDate',
			fieldStringValue : empStartFrom,
			fieldType : 'Date',
			operator : 'dateBegin'
		}, {
			fieldName : 'empStartDate',
			fieldStringValue : empStartEnd,
			fieldType : 'Date',
			operator : 'dateEnd'
		} ];
		orgMember.datagrid('reload');
	}
}

/*
 * 删除分类代码
 */
function deleteClsCode() {
	var row = $('#tbOrgCls').datagrid('getSelected');
	if (row == null) {
		$.messager.alert("提示信息", "请选择需要操作的记录！", 'warning');
	} else {
		$.messager.confirm('删除分类', '确定删除选中的分类信息？', function(retn) {
			if (retn) {
				$('#orgClsControl').maskit();
				$.post($url('/rest/fmxOrgClsRest/delete.json'), {
					orgClsId : row.orgClsId
				}, function(result) {
					$('#orgClsControl').maskit('unmask');
					if (result.code == 0) {
						$.messager.show({
							title : '提示信息',
							msg : '分类代码删除成功！',
							timeout : 5000,
							showType : 'slide'
						});
						searchOrgCls();
					} else {
						var msg = result.message || '操作失败！';
						$.messager.alert("错误信息", msg, 'error');
					}
				}, 'json');
			}
		});
	}
}

/*
 * 新增或修改
 */
function saveClsCode() {
	var url = $url('/rest/fmxOrgClsRest/save.json');
	$('#fmOrgCls').form('submit', {
		contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
		url : url,
		onSubmit : function() {
			return $(this).form('enableValidation').form('validate');
		},
		success : function(result) {
			var data = JSON.parse(result);
			if (data.code >= 0) {
				$.messager.show({
					title : '提示信息',
					msg : '分类代码保存成功！',
					timeout : 5000,
					showType : 'slide'
				});
				$("#dlgOrgCls").dialog("close");
				searchOrgCls();
			} else {
				var msg = data.message || '操作失败！';
				$.messager.alert("错误信息", msg, 'error');
			}
		}
	});
}

/*
 * 新增同级节点
 */
function newLeverNodes() {
	var row = $('#deptOrgTree').tree('getSelected');
	$('#dlgDeptOrg').dialog('open').dialog('setTitle', '新增节点');
	$('#fmDeptOrg').form('clear');
}

/*
 * 删除节点
 */
function deleteNodes() {
	var row = $('#deptOrgTree').tree('getSelected');
	var now = $('#tbOrgCls').datagrid('getSelected');
	if (row == null) {
		$.messager.alert("提示信息", "请选择需要操作的记录！", 'warning');
	} else {
		$.messager.confirm('删除节点', '确定删除选中的节点信息？', function(retn) {
			if (retn) {
				$('#orgClsControl').maskit();
				$.post($url('/rest/fmxOrgRest/delete.json'), {
					orgId : row.id
				}, function(result) {
					$('#orgClsControl').maskit('unmask');
					if (result.code == 0) {
						$.messager.show({
							title : '提示信息',
							msg : '节点信息删除成功！',
							timeout : 5000,
							showType : 'slide'
						});
						LoadTree(now.orgClsId);
					} else {
						var msg = result.message || '操作失败！';
						$.messager.alert("错误信息", msg, 'error');
					}
				}, 'json');
			}
		});
	}
}

/*
 * 新增部门架构
 */
function saveDeptOrg() {
	var row = $('#tbOrgCls').datagrid('getSelected');
	$('#eClsId').val(row["orgClsId"]);
	$('#eOrgParentId').val("0");
	var url = $url('/rest/fmxOrgRest/save.json');
	$('#fmDeptOrg').form('submit', {
		contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
		url : url,
		onSubmit : function() {
			return $(this).form('enableValidation').form('validate');
		},
		success : function(result) {
			var data = JSON.parse(result);
			if (data.code >= 0) {
				$.messager.show({
					title : '提示信息',
					msg : '节点信息保存成功！',
					timeout : 5000,
					showType : 'slide'
				});
				$("#dlgDeptOrg").dialog("close");
				LoadTree(row["orgClsId"]);
			} else {
				var msg = data.message || '操作失败！';
				$.messager.alert("错误信息", msg, 'error');
			}
		}
	});
}

/*
 * 保存成员
 */
function saveClsMember() {
	var row = $('#deptOrgTree').tree('getSelected');
	if (row) {
		var url = $url('/rest/fmxOrgMemberRest/save.json');
		$postJSON(url, rowData, function(data) {
			if (data.code >= 0) {
				rowData = [];
				$.messager.show({
					title : '提示信息',
					msg : '成员信息保存成功！',
					timeout : 5000,
					showType : 'slide'
				});
			} else {
				var msg = data.message || '操作失败！';
				$.messager.alert("错误信息", msg, 'error');
			}
		});
	} else {
		$.messager.alert("提示信息", "组织架构为空,不能保存成员信息！", 'warning');
	}
}
