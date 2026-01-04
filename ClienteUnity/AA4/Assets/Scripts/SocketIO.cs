using System;
using System.Collections.Generic;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;
using Newtonsoft.Json.Linq;
public class SocketIO : MonoBehaviour
{
    public SocketIOUnity socket;
    public string serverUrlLink = "http://192.168.1.41:3000";
    void Start()
    {
        var uri = new Uri(serverUrlLink);
        socket = new SocketIOUnity(uri);


        socket.OnConnected += (sender, e) =>
        {
            Debug.Log("socket.OnConnected");
        };


        socket.On("message", response =>
        {
            Debug.Log("Event" + response.ToString());
            Debug.Log(response.GetValue<string>());
        });


        socket.Connect();
    }
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            socket.EmitAsync("message", "Niggers");
        }
    }

    void OnDestroy()
    {
        socket.Dispose();
    }
}
