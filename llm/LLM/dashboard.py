import streamlit as st
import pandas as pd
import folium
from streamlit_folium import st_folium
import os

# --- Page Setup ---
st.set_page_config(page_title="FarmHawk Ground Control", layout="wide")
st.title("🦅 FarmHawk: Precision Agriculture Dashboard")
st.markdown("Live spatial mapping of field anomalies detected by edge-AI scouting.")

# --- Load the Database (CSV) ---
csv_file = 'farmhawk_logs.csv'

# Check if the log file exists and has data
if os.path.exists(csv_file) and os.path.getsize(csv_file) > 0:
    try:
        df = pd.read_csv(csv_file)
        
        # Display summary metrics at the top
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Anomalies Detected", len(df))
        col2.metric("Diseases Found", len(df[df['Type'] == 'DISEASE']))
        col3.metric("Pests Found", len(df[df['Type'] == 'PEST']))

        # --- The Map Engine ---
        st.subheader("Field Threat Heatmap")
        
        # Center the map on the first detected point (or a default location in Rajasthan)
        start_lat = df['Latitude'].iloc[0] if not df.empty else 26.827
        start_long = df['Longitude'].iloc[0] if not df.empty else 75.565
        
        # Create a Folium map (Satellite view for agriculture is better)
        m = folium.Map(location=[start_lat, start_long], zoom_start=18, tiles="CartoDB positron")

        # Plot every detection from the CSV onto the map
        for index, row in df.iterrows():
            # Choose color based on threat type
            if row['Type'] == 'DISEASE':
                pin_color = 'red'
                icon = 'leaf'
            else:
                pin_color = 'blue'
                icon = 'bug'

            # Create the popup text (What the farmer sees when clicking a pin)
            popup_text = f"<b>Type:</b> {row['Type']}<br><b>Name:</b> {row['Name']}<br><b>Confidence:</b> {row['Confidence']}"

            # Drop the pin
            folium.Marker(
                location=[row['Latitude'], row['Longitude']],
                popup=folium.Popup(popup_text, max_width=300),
                icon=folium.Icon(color=pin_color, icon=icon, prefix='fa') # 'fa' uses FontAwesome icons
            ).add_to(m)

        # Render the map in Streamlit
        st_folium(m, width=1200, height=600)
        
        # Show the raw data table below the map
        st.subheader("Raw Detection Logs")
        st.dataframe(df.tail(10)) # Show the 10 most recent detections

    except pd.errors.EmptyDataError:
        st.info("The log file is empty. Start the FarmHawk live scanner to generate data.")
else:
    st.warning("No detection logs found. Please run the FarmHawk scanner first.")
    
# --- Auto-Refresh Logic (For live demos) ---
# This button allows you to manually pull new data if the camera is running in the background
if st.button("Refresh Dashboard"):
    st.rerun()