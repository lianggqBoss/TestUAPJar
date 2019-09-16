(function(){
	var exportExcelFn = $.fn.datagrid.methods.exportExcel;
	$.fn.datagrid.defaults.exportType='jsxls';
	$.fn.datagrid.methods.exportExcel = function(jq,currentPageOnly) {
		return jq.each(function(){
			var $datagrid = $(this),opts = $.data(this,"datagrid").options;
			if("jsxls" !== opts.exportType){
				return exportExcelFn($datagrid,currentPageOnly);
			}else if(currentPageOnly){
				doExportCurrent($datagrid,opts);
			}else{
				doExportAll($datagrid,opts);
			}
		});
	}
	
	function s2ab(s) {
		if(typeof ArrayBuffer !== 'undefined') {
			var buf = new ArrayBuffer(s.length);
			var view = new Uint8Array(buf);
			for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
			return buf;
		} else {
			var buf = new Array(s.length);
			for (var i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
			return buf;
		}
	}	
	function export_table_to_excel(table, type, fn) {
		if(typeof table == 'string'){
			table = document.getElementById(table);
		}else if(table.length){
			table = table[0];
		}
		var wb = XLSX.utils.table_to_book(table, {
			sheet : "grid-data"
		});
		var wbout = XLSX.write(wb, {
			bookType : type || 'xlsx',
			bookSST : true,
			type : 'binary'
		});
		var fname = fn || 'grid-data.' + (type || 'xlsx');
		try {
			saveAs(new Blob([ s2ab(wbout) ], {
				type : "application/octet-stream"
			}), fname);
		} catch (e) {
			if (typeof console != 'undefined'){
				console.log(e, wbout);
				$.messager.alert('Export error',e);
			}
		}
		return wbout;
	}	
	
	function rerenderDatagrid($datagrid,$ct) {
		function mergeHeader($target,$header1,$header2) {
			var $body = $target.children("tbody"),$body1 = $header1.children("tbody"),$body2 = $header2.children("tbody");
			var $rows1 = $body1.children(),$rows2 = $body2.children();
			var rowspan = $rows2.length - $rows1.length; 
			if(rowspan == 0){
				$body.append($body1.html());
				$body.children().each(function(i){
					$(this).append($rows2.eq(i).html());
				});
			}else{
				$rows1.each(function(i){
					if(i == 0){
						$("<tr></tr>").appendTo($body).append($(this).html()).children().attr('rowspan',rowspan + 1);
					}else{
						$("<tr></tr>").appendTo($body).append($(this).html());
					}
				});
				var $tr,$rows = $body.children();
				$rows2.each(function(i){
					$tr = $rows.eq(i);
					if($tr.length){
						$tr.append($(this).html());
					}else{
						$("<tr></tr>").appendTo($body).append($(this).html());
					}
				});
			}
		}
		function mergeRows($target,$table1,$table2){
			var $body = $("<tbody></tbody>").append($table1.children("tbody").html());
			var $rows = $body.children();
			$table2.children("tbody").children().each(function(i){
				var $row = $rows.eq(i);
				if($row.length){
					$row.append($(this).html());
				}
			});
			$target.children("tbody").append($body.html());
		}
		var $target = $('<table border="1" cellspacing="0" cellpadding="0"><tbody></tbody></table>');
		var state = $datagrid.data("datagrid");
		if(state.options.showHeader) {
			mergeHeader($target,state.dc.header1.children("table"),state.dc.header2.children("table"));
		}
		if(state.data.total){
			mergeRows($target,state.dc.body1.children("table"),state.dc.body2.children("table"));
		}
		if(state.options.showFooter && state.footer){
			mergeRows($target,state.dc.footer1.children("table"),state.dc.footer2.children("table"));
		}
		//remove hidden fields and checkbox field
		$target.find("td[field]").each(function(){
			var $el = $(this);
			if($el.attr('field') == 'ck' || $el.css('display') == 'none'){
				$el.remove();
			}
		});
		$target.find("input").each(function(){
			var $el = $(this);
			var type = ($el.attr('type') || '').toLowerCase();
			if(type == 'checkbox' || type == 'radio'){
				if($el.attr('checked')){
					$el.replaceWith('<span>√</span>');
				}
			}else if(type != '"hidden"'){
				$el.replaceWith('<span>'+$el.val()+'</span>');
			}
		});		
		if($ct) {
			$ct.empty().append($target);
		}			
		return $target;			
	}		
	
	function doExportCurrent($datagrid,opts) {
		var $table = rerenderDatagrid($datagrid);
		var fn = (opts.exportFilename || $datagrid.attr('id') || 'grid-data') + '.xlsx';
		export_table_to_excel($table,'xlsx',fn);
	}
	
	function doExportAll($datagrid) {
		var state = $datagrid.data('datagrid');
		if(!state.options.pagination || (state.data && state.data.total <= state.options.pageSize)){
			return doExportCurrent($datagrid,state.options);
		}		
		var dc = $.extend({},state.dc);
		//clone dc context
		$.each(state.dc,function(k,v){
			state.dc[k] = v.clone();
		});
		var pagination = state.options.pagination;
		var onLoadSuccess = state.options.onLoadSuccess;
		var onLoadError = state.options.onLoadError;
		state.options.pagination = false;
		state.options.onLoadSuccess = function(data) {
			if(onLoadSuccess){
				onLoadSuccess.call(this,data);
			}
			setTimeout(function(){
				doExportCurrent($datagrid,state.options);
				state.dc = dc;
				state.options.pagination = pagination;
				state.options.onLoadSuccess = onLoadSuccess;
				state.options.onLoadError = onLoadError;
			},20);
		}
		state.options.onLoadError = function() {
			state.dc = dc;
			state.options.pagination = pagination;
			state.options.onLoadSuccess = onLoadSuccess;
			state.options.onLoadError = onLoadError;			
			if(onLoadError) {
				onLoadError.apply(this, arguments);
			}
		}
		$datagrid.datagrid('reload');
	}
})();