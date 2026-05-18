package com.example.gpiApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@SpringBootApplication
public class GpiAppApplication {

	public static void main(String[] args) {
		ApplicationContext ctx = SpringApplication.run(GpiAppApplication.class, args);
		
		try {
			DataSource dataSource = ctx.getBean(DataSource.class);
			try (Connection conn = dataSource.getConnection()) {
				System.out.println("==================================================");
				System.out.println("DIAGNOSTIC: Connected to database URL: " + conn.getMetaData().getURL());
				System.out.println("DIAGNOSTIC: Database User: " + conn.getMetaData().getUserName());
				

				try (Statement stmt = conn.createStatement()) {
					// Check allUsers count
					try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `allUsers`")) {
						if (rs.next()) {
							System.out.println("DIAGNOSTIC: Number of users in 'allUsers' table: " + rs.getLong(1));
						}
					} catch (Exception e) {
						System.out.println("DIAGNOSTIC: Error querying allUsers count: " + e.getMessage());
					}
					
					// Check projects count
					try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `projects`")) {
						if (rs.next()) {
							System.out.println("DIAGNOSTIC: Number of projects in 'projects' table: " + rs.getLong(1));
						}
					} catch (Exception e) {
						System.out.println("DIAGNOSTIC: Error querying projects count: " + e.getMessage());
					}
				}
				System.out.println("==================================================");
			}
		} catch (Exception e) {
			System.err.println("DIAGNOSTIC ERROR: " + e.getMessage());
		}
	}

}
