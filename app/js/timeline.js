var chart;
var dataTable;
var timelineOptions;
var isLoadedGoogleCharts = false;
var mainCtrlScope;
function initGoogleChartTimeline(){
    if(!isLoadedGoogleCharts){
        google.charts.load("current", {packages:["timeline"]});    
        google.charts.setOnLoadCallback(preDrawTimelineChart);   
    }
    isLoadedGoogleCharts = true;
}


function selectEventHandler(){
    var selection = chart.getSelection();
    if(!selection || !selection[0] || !selection[0].row){
        mainCtrlScope.scrollToAnchor();
        return;
    }
    // console.info("Selection:");
    // var row;
    // if(dataTable.Lf[selection[0].row])
    // var row = dataTable.Lf[selection[0].row].c;
    // console.info(row);
    mainCtrlScope.scrollToAnchor(selection[0].row)
}

function preDrawTimelineChart(){

}

function emptyTimelineChart(){
    $("#timelineDash").empty();
}

function drawTimelineChart(scope, rows, filters) {
    mainCtrlScope = scope;
    var container = document.getElementById('timelineDash');
    if(!container){
        return;
    }
    timelineOptions = {
        enableInteractivity : true,
        colors: ["#00FF00", "#FF0000"],
        tooltip : {
            isHtml: true
        },
    }
    chart = new google.visualization.Timeline(container);
    google.visualization.events.addListener(chart, 'select', selectEventHandler);
    dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'InstanceID' });
    dataTable.addColumn({ type: 'string', id: 'EventType' });
    //dataTable.addColumn({ type: 'string', id: 'logRowId' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', 'p': {'html': true}});
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addRows(rows);

    //try{
    //console.log("Hey you");
    chart.draw(dataTable, timelineOptions);
    //}catch(e){}
}
initGoogleChartTimeline();
