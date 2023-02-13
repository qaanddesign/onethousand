/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 98.5, "KoPercent": 1.5};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.361875, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.2615, 500, 1500, "Demographics"], "isController": false}, {"data": [0.319, 500, 1500, "Health Finance"], "isController": false}, {"data": [0.335, 500, 1500, "Health Facility"], "isController": false}, {"data": [0.532, 500, 1500, "Disease Surveillance"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 4000, 60, 1.5, 1602.3654999999992, 197, 21109, 1378.0, 2557.7000000000003, 3661.0, 7034.939999999999, 176.34351717145, 1311.596540842812, 25.253416311224264], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Demographics", 1000, 43, 4.3, 1969.9969999999985, 499, 21109, 1298.0, 3479.2, 4946.599999999999, 8523.710000000005, 45.93055300385817, 341.11361317001194, 6.394887570618225], "isController": false}, {"data": ["Health Finance", 1000, 5, 0.5, 1541.8980000000008, 204, 6301, 1405.0, 1732.9, 2767.2499999999977, 5665.88, 47.67807761991037, 354.7919447887861, 6.844411533326976], "isController": false}, {"data": ["Health Facility", 1000, 12, 1.2, 1639.0999999999992, 212, 7569, 1427.0, 2802.9, 4127.149999999999, 6117.96, 46.28558204119417, 344.42981948623003, 6.599311501967137], "isController": false}, {"data": ["Disease Surveillance", 1000, 0, 0.0, 1258.4669999999999, 197, 5491, 1336.0, 1462.9, 1584.9499999999998, 4634.650000000001, 49.89273062914734, 371.2720775333034, 7.357228833009031], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 7,552 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,269 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 208.87.128.190:3030 [/208.87.128.190] failed: Connection timed out: connect", 3, 5.0, 0.075], "isController": false}, {"data": ["The operation lasted too long: It took 8,047 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 8,528 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,045 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 8,078 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,599 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,473 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,798 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,238 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,567 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,108 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,355 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 8,766 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,993 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,035 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,028 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 9,579 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,792 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 9,301 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,582 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,054 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,531 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 9,091 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,118 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 9,292 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,296 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,263 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,249 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,722 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,834 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,017 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,532 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 8,099 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,792 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,301 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,788 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,253 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 9,343 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,224 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,233 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,229 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,140 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,145 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,088 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,883 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,029 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,479 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,061 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,260 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,450 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,114 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,091 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,827 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,569 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 6,348 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}, {"data": ["The operation lasted too long: It took 7,550 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, 1.6666666666666667, 0.025], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 4000, 60, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 208.87.128.190:3030 [/208.87.128.190] failed: Connection timed out: connect", 3, "The operation lasted too long: It took 7,552 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 7,269 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 8,047 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 8,528 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Demographics", 1000, 43, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 208.87.128.190:3030 [/208.87.128.190] failed: Connection timed out: connect", 3, "The operation lasted too long: It took 7,552 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 8,099 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 7,269 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,788 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1], "isController": false}, {"data": ["Health Finance", 1000, 5, "The operation lasted too long: It took 6,061 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,301 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,088 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,253 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,017 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1], "isController": false}, {"data": ["Health Facility", 1000, 12, "The operation lasted too long: It took 6,599 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,792 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,140 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,118 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1, "The operation lasted too long: It took 6,114 milliseconds, but should not have lasted longer than 6,000 milliseconds.", 1], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
