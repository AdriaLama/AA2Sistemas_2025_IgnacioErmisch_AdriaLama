using Newtonsoft.Json.Linq;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using SocketIOClient.Transport;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SocketIO : MonoBehaviour
{
    public SocketIOUnity socket;
    public string serverUrlLink = "http://192.168.1.41:3000";

    public NodeGrid[] playerGrids;
    public PlayerUIPanel[] playerUIPanels; // Nueva referencia

    public GameObject roomListPanel;
    public GameObject gameViewPanel;
    public Transform roomListContent;
    public GameObject roomButtonPrefab;
    public TextMeshProUGUI statusText;

    private Dictionary<string, int> socketIdToPlayerIndex = new();
    private List<GameObject> roomButtons = new();
    private int currentRoomId = -1;
    private Queue<Action> mainThreadActions = new Queue<Action>();
    private object lockObject = new object();

    void Start()
    {
        if (playerGrids == null || playerGrids.Length == 0) return;
        if (roomListPanel) roomListPanel.SetActive(true);
        if (gameViewPanel) gameViewPanel.SetActive(false);

        socket = new SocketIOUnity(new Uri(serverUrlLink), new SocketIOOptions
        {
            Transport = TransportProtocol.WebSocket
        });

        socket.OnConnected += (_, __) =>
        {
            EnqueueAction(() =>
            {
                UpdateStatus("Conectado");
                socket.Emit("requestRoomsList");
            });
        };

        socket.OnDisconnected += (_, __) =>
        {
            EnqueueAction(() => UpdateStatus("Desconectado"));
        };

        socket.On("roomsList", response =>
        {
            try
            {
                JToken token = JToken.Parse(response.ToString());
                JArray roomsArray = token switch
                {
                    JArray a when a.Count > 0 && a[0] is JArray inner => (JArray)inner,
                    JArray a => a,
                    JObject o when o["rooms"] is JArray r => r,
                    _ => null
                };

                if (roomsArray == null) return;

                EnqueueAction(() =>
                {
                    foreach (var btn in roomButtons) Destroy(btn);
                    roomButtons.Clear();

                    foreach (JObject room in roomsArray)
                    {
                        int roomId = room["roomId"].ToObject<int>();
                        string roomName = room["roomName"].ToObject<string>();
                        string status = room["status"].ToObject<string>();
                        int playerCount = room["playerCount"].ToObject<int>();
                        int maxPlayers = room["maxPlayers"].ToObject<int>();

                        if (status == "playing" || status == "waiting")
                            CreateRoomButton(roomId, roomName, status, playerCount, maxPlayers);
                    }

                    UpdateStatus($"{roomsArray.Count} salas disponibles");
                });
            }
            catch { }
        });

        socket.On("spectatorJoined", response =>
        {
            EnqueueAction(() =>
            {
                try
                {
                    JToken token = JToken.Parse(response.ToString());
                    JObject data = token switch
                    {
                        JArray arr when arr.Count > 0 && arr[0] is JObject obj => obj,
                        JObject obj => obj,
                        _ => null
                    };

                    if (data == null) return;

                    int roomId = data["roomId"]?.ToObject<int>() ?? -1;
                    UpdateStatus($"Espectando sala {roomId}");
                }
                catch { }
            });
        });

        socket.On("gameSetup", response =>
        {
            EnqueueAction(() =>
            {
                try
                {
                    JToken token = JToken.Parse(response.ToString());
                    JObject setupData = token switch
                    {
                        JArray arr when arr.Count > 0 && arr[0] is JObject obj => obj,
                        JObject obj => obj,
                        _ => null
                    };

                    if (setupData == null) return;

                    var players = setupData["players"]?.ToObject<List<JObject>>();
                    if (players == null) return;

                    socketIdToPlayerIndex.Clear();

                    for (int i = 0; i < players.Count && i < playerGrids.Length; i++)
                    {
                        var p = players[i];
                        string socketId = p["socketId"]?.ToObject<string>() ?? "";
                        string playerName = p["playerName"]?.ToObject<string>() ?? "Unknown";
                        int playerId = p["playerId"]?.ToObject<int>() ?? i;
                        int sizeX = p["sizeX"]?.ToObject<int>() ?? 6;
                        int sizeY = p["sizeY"]?.ToObject<int>() ?? 12;

                        socketIdToPlayerIndex[socketId] = i;

                        // Activar y configurar el grid
                        if (playerGrids[i].gameObject != null)
                        {
                            playerGrids[i].gameObject.SetActive(true);
                        }

                        playerGrids[i].SetupGrid(new NodeGrid.GridSetup
                        {
                            playerId = playerId,
                            playerName = playerName,
                            sizeX = sizeX,
                            sizeY = sizeY
                        });

                        // Inicializar UI Panel si existe
                        if (playerUIPanels != null && i < playerUIPanels.Length && playerUIPanels[i] != null)
                        {
                            playerUIPanels[i].gameObject.SetActive(true);
                            playerUIPanels[i].Initialize(playerId, playerName);
                        }
                    }

                    // Desactivar grids y panels no usados
                    for (int i = players.Count; i < playerGrids.Length; i++)
                    {
                        if (playerGrids[i].gameObject != null)
                        {
                            playerGrids[i].gameObject.SetActive(false);
                        }

                        if (playerUIPanels != null && i < playerUIPanels.Length && playerUIPanels[i] != null)
                        {
                            playerUIPanels[i].gameObject.SetActive(false);
                        }
                    }

                    if (roomListPanel) roomListPanel.SetActive(false);
                    if (gameViewPanel) gameViewPanel.SetActive(true);

                    UpdateStatus("Setup completado");
                }
                catch { }
            });
        });

        socket.On("gameStart", response =>
        {
            EnqueueAction(() => UpdateStatus("Partida iniciada!"));
        });

        socket.On("gameUpdate", response =>
        {
            EnqueueAction(() =>
            {
                try
                {
                    JToken token = JToken.Parse(response.ToString());
                    JObject statesData = token switch
                    {
                        JArray arr when arr.Count > 0 && arr[0] is JObject obj => obj,
                        JObject obj => obj,
                        _ => null
                    };

                    if (statesData == null) return;

                    foreach (var kvp in statesData)
                    {
                        string socketId = kvp.Key;

                        if (!socketIdToPlayerIndex.TryGetValue(socketId, out int index)) continue;
                        if (index >= playerGrids.Length) continue;

                        var state = (JObject)kvp.Value;

                        var update = new NodeGrid.GridUpdate
                        {
                            playerId = SafeParseInt(state["playerId"], 0),
                            playerName = state["playerName"]?.ToString() ?? "",
                            updatedNodes = new List<NodeGrid.Node>()
                        };

                        var nodesArray = state["updatedNodes"];

                        if (nodesArray != null && nodesArray is JArray nodes)
                        {
                            foreach (var n in nodes)
                            {
                                try
                                {
                                    int x = SafeParseInt(n["x"], -1);
                                    int y = SafeParseInt(n["y"], -1);
                                    int type = SafeParseInt(n["type"], 0);

                                    if (x >= 0 && y >= 0)
                                    {
                                        update.updatedNodes.Add(new NodeGrid.Node(
                                            (NodeGrid.Node.JewelType)type,
                                            x,
                                            y
                                        ));
                                    }
                                }
                                catch { }
                            }
                        }

                        playerGrids[index].UpdateGrid(update);

                        if (playerUIPanels != null && index < playerUIPanels.Length && playerUIPanels[index] != null)
                        {
                            int score = SafeParseInt(state["score"], 0);
                            int level = SafeParseInt(state["level"], 1);
                            bool isAlive = state["isAlive"]?.ToObject<bool>() ?? true;

                            playerUIPanels[index].UpdateScore(score);
                            playerUIPanels[index].UpdateLevel(level);

                           
                            var nextPieceArray = state["nextPiece"];
                            if (nextPieceArray is JArray nextPiece && nextPiece.Count == 3)
                            {
                                int[] pieceData = new int[3];
                                for (int i = 0; i < 3; i++)
                                {
                                    pieceData[i] = SafeParseInt(nextPiece[i], 0);
                                }
                                playerUIPanels[index].UpdateNextPiece(pieceData);
                            }
                        }
                    }
                }
                catch { }
            });
        });

        socket.On("gameOver", response =>
        {
            EnqueueAction(() =>
            {
                try
                {
                    JToken token = JToken.Parse(response.ToString());
                    JObject gameOverData = token switch
                    {
                        JArray arr when arr.Count > 0 && arr[0] is JObject obj => obj,
                        JObject obj => obj,
                        _ => null
                    };

                    if (gameOverData == null) return;

                    string winner = gameOverData["winner"]?.ToObject<string>() ?? "Unknown";
                    UpdateStatus($"Ganador: {winner}");
                    Invoke(nameof(ReturnToLobby), 5f);
                }
                catch { }
            });
        });

        socket.On("error", response =>
        {
            EnqueueAction(() =>
            {
                try
                {
                    JToken token = JToken.Parse(response.ToString());
                    JObject errorData = token switch
                    {
                        JArray arr when arr.Count > 0 && arr[0] is JObject obj => obj,
                        JObject obj => obj,
                        _ => null
                    };

                    if (errorData == null) return;

                    string errorMsg = errorData["message"]?.ToObject<string>() ?? "Error desconocido";
                    UpdateStatus("Error: " + errorMsg);
                }
                catch { }
            });
        });

        socket.Connect();
    }

    private int SafeParseInt(JToken token, int defaultValue)
    {
        if (token == null) return defaultValue;

        try
        {
            if (token.Type == JTokenType.Integer) return token.ToObject<int>();
            if (token.Type == JTokenType.String)
            {
                string str = token.ToString();
                if (int.TryParse(str, out int result)) return result;
            }
            return token.ToObject<int>();
        }
        catch
        {
            return defaultValue;
        }
    }

    void EnqueueAction(Action action)
    {
        lock (lockObject)
        {
            mainThreadActions.Enqueue(action);
        }
    }

    void Update()
    {
        lock (lockObject)
        {
            while (mainThreadActions.Count > 0)
            {
                var action = mainThreadActions.Dequeue();
                try
                {
                    action?.Invoke();
                }
                catch { }
            }
        }
    }

    void CreateRoomButton(int roomId, string name, string status, int count, int max)
    {
        if (roomButtonPrefab == null || roomListContent == null) return;

        try
        {
            var btn = Instantiate(roomButtonPrefab, roomListContent);
            if (btn == null) return;

            roomButtons.Add(btn);

            var textComponent = btn.GetComponentInChildren<TextMeshProUGUI>();
            if (textComponent != null)
            {
                textComponent.text = $"{name}\n{count}/{max} - {status}";
            }

            var buttonComponent = btn.GetComponent<Button>();
            if (buttonComponent != null)
            {
                int capturedRoomId = roomId;
                buttonComponent.onClick.AddListener(() => JoinRoomAsSpectator(capturedRoomId));
            }
        }
        catch { }
    }

    public void JoinRoomAsSpectator(int roomId)
    {
        currentRoomId = roomId;
        socket.Emit("spectateRoom", new { roomId });
        UpdateStatus($"Uniendose a sala {roomId}...");
    }

    public void ReturnToLobby()
    {
        socket.Emit("leaveRoom");
        currentRoomId = -1;

        if (roomListPanel) roomListPanel.SetActive(true);
        if (gameViewPanel) gameViewPanel.SetActive(false);

        socket.Emit("requestRoomsList");
        UpdateStatus("Lobby");
    }

    void UpdateStatus(string msg)
    {
        if (statusText) statusText.text = msg;
    }

    void OnDestroy()
    {
        socket?.Dispose();
    }
}