package com.logiflow.server.utils;

import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.models.Order;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class OrderFileParser {

    public static List<OrderCreateRequest> parseCSV(InputStream inputStream) throws IOException, CsvException {
        List<OrderCreateRequest> requests = new ArrayList<>();
        
        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> rows = reader.readAll();

            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);

                if (row.length == 0 || (row.length == 1 && (row[0] == null || row[0].trim().isEmpty()))) {
                    continue;
                }
                
                OrderCreateRequest request = new OrderCreateRequest();
                

                if (row.length > 0 && row[0] != null && !row[0].trim().isEmpty()) {
                    request.setCustomerName(row[0].trim());
                }
                
                if (row.length > 1 && row[1] != null && !row[1].trim().isEmpty()) {
                    request.setCustomerPhone(row[1].trim());
                }
                
                if (row.length > 2 && row[2] != null && !row[2].trim().isEmpty()) {
                    request.setPickupAddress(row[2].trim());
                }
                
                if (row.length > 3 && row[3] != null && !row[3].trim().isEmpty()) {
                    request.setDeliveryAddress(row[3].trim());
                }
                
                if (row.length > 4 && row[4] != null && !row[4].trim().isEmpty()) {
                    request.setPackageDetails(row[4].trim());
                }
                
                if (row.length > 5 && row[5] != null && !row[5].trim().isEmpty()) {
                    try {
                        request.setPriorityLevel(Order.PriorityLevel.valueOf(row[5].trim().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                    }
                } else {
                    request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                }
                
                // Distance (km) - column 6
                if (row.length > 6 && row[6] != null && !row[6].trim().isEmpty()) {
                    try {
                        request.setDistanceKm(new java.math.BigDecimal(row[6].trim()));
                    } catch (NumberFormatException e) {
                        request.setDistanceKm(null);
                    }
                }

                // Weight (tons) - column 7
                if (row.length > 7 && row[7] != null && !row[7].trim().isEmpty()) {
                    try {
                        request.setWeightTons(new java.math.BigDecimal(row[7].trim()));
                    } catch (NumberFormatException e) {
                        request.setWeightTons(null);
                    }
                }

                // Pickup Type - column 8
                if (row.length > 8 && row[8] != null && !row[8].trim().isEmpty()) {
                    try {
                        request.setPickupType(Order.PickupType.valueOf(row[8].trim().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        request.setPickupType(null);
                    }
                }

                // Container Number - column 9
                if (row.length > 9 && row[9] != null && !row[9].trim().isEmpty()) {
                    request.setContainerNumber(row[9].trim());
                }

                // Dock Info - column 10
                if (row.length > 10 && row[10] != null && !row[10].trim().isEmpty()) {
                    request.setDockInfo(row[10].trim());
                }

                // Package Value - column 11
                if (row.length > 11 && row[11] != null && !row[11].trim().isEmpty()) {
                    try {
                        request.setPackageValue(new java.math.BigDecimal(row[11].trim()));
                    } catch (NumberFormatException e) {
                        request.setPackageValue(null);
                    }
                }

                // Trip ID - column 12
                if (row.length > 12 && row[12] != null && !row[12].trim().isEmpty()) {
                    try {
                        request.setTripId(Integer.parseInt(row[12].trim()));
                    } catch (NumberFormatException e) {
                        request.setTripId(null);
                    }
                }
                
                requests.add(request);
            }
        }
        
        return requests;
    }

    public static List<OrderCreateRequest> parseExcel(InputStream inputStream) throws IOException {
        List<OrderCreateRequest> requests = new ArrayList<>();
        
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                
                if (row == null) {
                    continue;
                }

                if (isRowEmpty(row)) {
                    continue;
                }
                
                OrderCreateRequest request = new OrderCreateRequest();

                Cell cell0 = row.getCell(0);
                if (cell0 != null && getCellValueAsString(cell0) != null && !getCellValueAsString(cell0).trim().isEmpty()) {
                    request.setCustomerName(getCellValueAsString(cell0).trim());
                }
                
                Cell cell1 = row.getCell(1);
                if (cell1 != null) {
                    String value = getCellValueAsString(cell1);
                    if (value != null && !value.trim().isEmpty()) {
                        request.setCustomerPhone(value.trim());
                    }
                }
                
                Cell cell2 = row.getCell(2);
                if (cell2 != null && getCellValueAsString(cell2) != null && !getCellValueAsString(cell2).trim().isEmpty()) {
                    request.setPickupAddress(getCellValueAsString(cell2).trim());
                }
                
                Cell cell3 = row.getCell(3);
                if (cell3 != null && getCellValueAsString(cell3) != null && !getCellValueAsString(cell3).trim().isEmpty()) {
                    request.setDeliveryAddress(getCellValueAsString(cell3).trim());
                }
                
                Cell cell4 = row.getCell(4);
                if (cell4 != null) {
                    String value = getCellValueAsString(cell4);
                    if (value != null && !value.trim().isEmpty()) {
                        request.setPackageDetails(value.trim());
                    }
                }
                
                Cell cell5 = row.getCell(5);
                if (cell5 != null) {
                    String value = getCellValueAsString(cell5);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setPriorityLevel(Order.PriorityLevel.valueOf(value.trim().toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                        }
                    } else {
                        request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                    }
                } else {
                    request.setPriorityLevel(Order.PriorityLevel.NORMAL);
                }
                
                // Distance (km) - column 6
                Cell cell6 = row.getCell(6);
                if (cell6 != null) {
                    String value = getCellValueAsString(cell6);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setDistanceKm(new java.math.BigDecimal(value.trim()));
                        } catch (NumberFormatException e) {
                            request.setDistanceKm(null);
                        }
                    }
                }

                // Weight (tons) - column 7
                Cell cell7 = row.getCell(7);
                if (cell7 != null) {
                    String value = getCellValueAsString(cell7);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setWeightTons(new java.math.BigDecimal(value.trim()));
                        } catch (NumberFormatException e) {
                            request.setWeightTons(null);
                        }
                    }
                }

                // Pickup Type - column 8
                Cell cell8 = row.getCell(8);
                if (cell8 != null) {
                    String value = getCellValueAsString(cell8);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setPickupType(Order.PickupType.valueOf(value.trim().toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            request.setPickupType(null);
                        }
                    }
                }

                // Container Number - column 9
                Cell cell9 = row.getCell(9);
                if (cell9 != null) {
                    String value = getCellValueAsString(cell9);
                    if (value != null && !value.trim().isEmpty()) {
                        request.setContainerNumber(value.trim());
                    }
                }

                // Dock Info - column 10
                Cell cell10 = row.getCell(10);
                if (cell10 != null) {
                    String value = getCellValueAsString(cell10);
                    if (value != null && !value.trim().isEmpty()) {
                        request.setDockInfo(value.trim());
                    }
                }

                // Package Value - column 11
                Cell cell11 = row.getCell(11);
                if (cell11 != null) {
                    String value = getCellValueAsString(cell11);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setPackageValue(new java.math.BigDecimal(value.trim()));
                        } catch (NumberFormatException e) {
                            request.setPackageValue(null);
                        }
                    }
                }

                // Trip ID - column 12
                Cell cell12 = row.getCell(12);
                if (cell12 != null) {
                    String value = getCellValueAsString(cell12);
                    if (value != null && !value.trim().isEmpty()) {
                        try {
                            request.setTripId((int) Double.parseDouble(value.trim()));
                        } catch (NumberFormatException e) {
                            request.setTripId(null);
                        }
                    }
                }
                
                requests.add(request);
            }
        }
        
        return requests;
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private static boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && getCellValueAsString(cell) != null && !getCellValueAsString(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }
}
