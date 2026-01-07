using System;
using System.Collections.Generic;
using UnityEngine;

public class NodeGrid : MonoBehaviour
{
    [Serializable]
    public class Node
    {
        public enum JewelType
        {
            None = 0,
            Red = 1,
            Green = 2,
            Blue = 3,
            Yellow = 4,
            Orange = 5,
            Purple = 6,
            Shiny = 7
        }

        public int x, y;
        public JewelType type;

        public Node(JewelType type, int x, int y)
        {
            this.type = type;
            this.x = x;
            this.y = y;
        }
    }

    [Serializable]
    public class Grid
    {
        [Serializable]
        public class Column
        {
            public List<Node> nodes = new();
        }

        public List<Column> columns = new();

        [SerializeField]
        private int _playerId;
        public int PlayerId => _playerId;

        [SerializeField]
        private string _playerName;
        public string PlayerName => _playerName;

        [SerializeField]
        private int _sizeY;
        public int SizeY => _sizeY;

        public Grid(GridSetup gridSetup)
        {
            _playerId = gridSetup.playerId;
            _playerName = gridSetup.playerName;
            _sizeY = gridSetup.sizeY;

            for (int x = 0; x < gridSetup.sizeX; x++)
            {
                columns.Add(new());
                for (int y = 0; y < gridSetup.sizeY; y++)
                {
                    columns[x].nodes.Add(new Node(Node.JewelType.None, x, y));
                }
            }
        }

        public Node GetNode(int x, int y)
        {
            if (x < 0 || x >= columns.Count) return null;
            if (y < 0 || y >= columns[x].nodes.Count) return null;
            return columns[x].nodes[y];
        }

        public void SetNode(int x, int y, Node.JewelType type)
        {
            if (x < 0 || x >= columns.Count) return;
            if (y < 0 || y >= columns[x].nodes.Count) return;
            columns[x].nodes[y].type = type;
        }
    }

    [Serializable]
    public class GridUpdate
    {
        public int playerId;
        public string playerName;
        public List<Node> updatedNodes;
    }

    [Serializable]
    public class GridSetup
    {
        public int playerId;
        public string playerName;
        public int sizeX;
        public int sizeY;
    }

    [Header("Visual Settings")]
    [SerializeField] private GameObject jewelPrefab;
    [SerializeField] private float cellSize = 1f;
    [SerializeField] private Vector3 gridOffset = Vector3.zero;
    [SerializeField] private bool invertYAxis = true;

    [Header("Jewel Colors")]
    [SerializeField] private Color noneColor = new Color(0.1f, 0.1f, 0.1f, 0.3f);
    [SerializeField] private Color redColor = Color.red;
    [SerializeField] private Color greenColor = Color.green;
    [SerializeField] private Color blueColor = Color.blue;
    [SerializeField] private Color yellowColor = Color.yellow;
    [SerializeField] private Color orangeColor = new Color(1f, 0.5f, 0f);
    [SerializeField] private Color purpleColor = new Color(0.5f, 0f, 1f);
    [SerializeField] private Color shinyColor = Color.white;

    private Grid _grid;
    private GameObject[,] _visualNodes;
    private bool _isSetup = false;

    public void SetupGrid(GridSetup gridSetup)
    {
        _grid = new Grid(gridSetup);

        if (_visualNodes != null)
        {
            for (int x = 0; x < _visualNodes.GetLength(0); x++)
            {
                for (int y = 0; y < _visualNodes.GetLength(1); y++)
                {
                    if (_visualNodes[x, y] != null)
                        Destroy(_visualNodes[x, y]);
                }
            }
        }

        _visualNodes = new GameObject[gridSetup.sizeX, gridSetup.sizeY];

        for (int x = 0; x < gridSetup.sizeX; x++)
        {
            for (int y = 0; y < gridSetup.sizeY; y++)
            {
                int visualY = invertYAxis ? (gridSetup.sizeY - 1 - y) : y;
                Vector3 position = new Vector3(x * cellSize, visualY * cellSize, 0) + gridOffset;

                GameObject nodeObj;

                if (jewelPrefab != null)
                {
                    nodeObj = Instantiate(jewelPrefab, position, Quaternion.identity, transform);
                }
                else
                {
                    nodeObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    nodeObj.transform.position = position;
                    nodeObj.transform.localScale = Vector3.one * cellSize * 0.9f;
                    nodeObj.transform.parent = transform;
                }

                nodeObj.name = $"Node_{x}_{y}";
                _visualNodes[x, y] = nodeObj;
                UpdateNodeVisual(x, y, Node.JewelType.None);
            }
        }

        _isSetup = true;
    }

    public void UpdateGrid(GridUpdate gridUpdate)
    {
        if (!_isSetup || _grid == null || _visualNodes == null || gridUpdate.updatedNodes == null) return;

        foreach (var node in gridUpdate.updatedNodes)
        {
            if (node.x >= 0 && node.x < _grid.columns.Count &&
                node.y >= 0 && node.y < _grid.columns[node.x].nodes.Count)
            {
                _grid.SetNode(node.x, node.y, node.type);
                UpdateNodeVisual(node.x, node.y, node.type);
            }
        }
    }

    private void UpdateNodeVisual(int x, int y, Node.JewelType type)
    {
        if (_visualNodes == null || x < 0 || x >= _visualNodes.GetLength(0) ||
            y < 0 || y >= _visualNodes.GetLength(1)) return;

        GameObject nodeObj = _visualNodes[x, y];
        if (nodeObj == null) return;

        Renderer renderer = nodeObj.GetComponent<Renderer>();
        if (renderer == null) return;

        renderer.material.color = GetColorForJewelType(type);

        bool shouldBeActive = type != Node.JewelType.None;
        if (nodeObj.activeSelf != shouldBeActive)
        {
            nodeObj.SetActive(shouldBeActive);
        }
    }

    private Color GetColorForJewelType(Node.JewelType type)
    {
        return type switch
        {
            Node.JewelType.None => noneColor,
            Node.JewelType.Red => redColor,
            Node.JewelType.Green => greenColor,
            Node.JewelType.Blue => blueColor,
            Node.JewelType.Yellow => yellowColor,
            Node.JewelType.Orange => orangeColor,
            Node.JewelType.Purple => purpleColor,
            Node.JewelType.Shiny => shinyColor,
            _ => Color.gray
        };
    }

    private void OnDrawGizmos()
    {
        if (_grid == null) return;

        for (int x = 0; x < _grid.columns.Count; x++)
        {
            for (int y = 0; y < _grid.columns[x].nodes.Count; y++)
            {
                int visualY = invertYAxis ? (_grid.SizeY - 1 - y) : y;
                Vector3 position = new Vector3(x * cellSize, visualY * cellSize, 0) + gridOffset;

                Node.JewelType type = _grid.columns[x].nodes[y].type;
                Gizmos.color = GetColorForJewelType(type);

                if (type != Node.JewelType.None)
                {
                    Gizmos.DrawCube(position, Vector3.one * cellSize * 0.8f);
                }
                else
                {
                    Gizmos.DrawWireCube(position, Vector3.one * cellSize * 0.8f);
                }
            }
        }
    }
}