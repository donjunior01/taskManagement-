package com.example.gpiApp.service;

import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public byte[] generateTasksReport(Long projectId) throws JRException {
        List<Task> tasks = projectId != null 
            ? taskRepository.findByProjectId(projectId, org.springframework.data.domain.Pageable.unpaged()).getContent()
            : taskRepository.findAll();
        
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(tasks);
        
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", projectId != null ? "Tasks Report for Project" : "All Tasks Report");
        parameters.put("generatedBy", "Task Management System");
        
        InputStream reportStream = getClass().getResourceAsStream("/reports/tasks_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        
        return outputStream.toByteArray();
    }

    public byte[] generateProjectsReport() throws JRException {
        List<Project> projects = projectRepository.findAll();
        
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(projects);
        
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Projects Report");
        parameters.put("generatedBy", "Task Management System");
        
        InputStream reportStream = getClass().getResourceAsStream("/reports/projects_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        
        return outputStream.toByteArray();
    }

    public byte[] generateUsersReport() throws JRException {
        List<allUsers> users = userRepository.findAll();
        
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(users);
        
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Users Report");
        parameters.put("generatedBy", "Task Management System");
        
        InputStream reportStream = getClass().getResourceAsStream("/reports/users_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        
        return outputStream.toByteArray();
    }
}
