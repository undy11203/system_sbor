package com.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "settings")
public class Settings {

    @Id
    @Column(nullable = false)
    private String key;

    @Column(nullable = false)
    private String value;

    public Settings() {}

    public Settings(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
