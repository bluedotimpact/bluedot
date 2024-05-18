#!/usr/bin/env bash
set -euo pipefail
cd $(dirname "${BASH_SOURCE[0]:-$0}")/..

# Get the Cluster resources
clusters=$(kubectl get Cluster --no-headers -o custom-columns=NAME:.metadata.name)
if [ -z "$clusters" ]; then
    echo "No databases found. This might be a connection error: check the README for how to set up kubectl properly."
    exit 1
fi

# Allow user to select a cluster by number
echo "Available databases:"
cluster_array=($clusters)
for i in "${!cluster_array[@]}"; do
    echo "$((i+1)). ${cluster_array[$i]}"
done
read -p "Select a database to connect to: " selected_number
if ! [[ "$selected_number" =~ ^[0-9]+$ ]] || [ "$selected_number" -lt 1 ] || [ "$selected_number" -gt "${#cluster_array[@]}" ]; then
    echo "Invalid input. Expected a valid number in the range of 1 to ${#cluster_array[@]}."
    exit 1
fi
selected_cluster=${cluster_array[$((selected_number-1))]}

# Get the username, password, and database name from the corresponding secret
username=$(kubectl get secret "$selected_cluster-app" -o jsonpath='{.data.username}' | base64 -d)
password=$(kubectl get secret "$selected_cluster-app" -o jsonpath='{.data.password}' | base64 -d)
dbname=$(kubectl get secret "$selected_cluster-app" -o jsonpath='{.data.dbname}' | base64 -d)
if [ -z "$username" ] || [ -z "$password" ] || [ -z "$dbname" ]; then
    echo "Error: Unable to retrieve username, password, or database name from the secret."
    exit 1
fi

# Set up port forwarding
kubectl port-forward svc/"$selected_cluster-rw" 5433:5432 &
port_forward_pid=$!

# Open the connection URL
connection_url="postgresql://$username:$password@localhost:5433/$dbname"
echo "Opening connection... (if this doesn't work, make sure you have Postico installed)"
open "$connection_url"

# Tidy up port forwarding
read -p "Press Enter to close the connection..."
kill "$port_forward_pid"
