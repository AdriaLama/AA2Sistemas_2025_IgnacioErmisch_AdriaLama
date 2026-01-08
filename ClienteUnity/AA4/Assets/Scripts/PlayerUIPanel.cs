using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class PlayerUIPanel : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI playerNameText;
    [SerializeField] private TextMeshProUGUI scoreText;
    [SerializeField] private TextMeshProUGUI levelText;
    [SerializeField] private Image statusIndicator;

    [SerializeField] private GameObject nextPiecePanel;
    [SerializeField] private Image[] nextPieceJewels = new Image[3]; 

    [SerializeField] private Color aliveColor = Color.green;
    [SerializeField] private Color deadColor = Color.red;

    [SerializeField] private Color redColor = Color.red;
    [SerializeField] private Color greenColor = Color.green;
    [SerializeField] private Color blueColor = Color.blue;
    [SerializeField] private Color yellowColor = Color.yellow;
    [SerializeField] private Color orangeColor = new Color(1f, 0.5f, 0f);
    [SerializeField] private Color purpleColor = new Color(0.5f, 0f, 1f);

    private int currentPlayerId = -1;

    public void Initialize(int playerId, string playerName)
    {
        currentPlayerId = playerId;

        if (playerNameText != null)
            playerNameText.text = playerName;

        UpdateScore(0);
        UpdateLevel(1);
        ClearNextPiece();
    }

    public void UpdateScore(int score)
    {
        if (scoreText != null)
            scoreText.text = $"Score: {score}";
    }

    public void UpdateLevel(int level)
    {
        if (levelText != null)
            levelText.text = $"Level: {level}";
    }

    public void UpdateNextPiece(int[] nextPiece)
    {
        if (nextPiece == null || nextPiece.Length != 3)
        {
            ClearNextPiece();
            return;
        }

        if (nextPiecePanel != null)
            nextPiecePanel.SetActive(true);

        for (int i = 0; i < 3 && i < nextPieceJewels.Length; i++)
        {
            if (nextPieceJewels[i] != null)
            {
                nextPieceJewels[i].gameObject.SetActive(true);
                nextPieceJewels[i].color = GetColorForJewelType(nextPiece[i]);
            }
        }
    }

    private void ClearNextPiece()
    {
        if (nextPiecePanel != null)
            nextPiecePanel.SetActive(false);

        foreach (var jewel in nextPieceJewels)
        {
            if (jewel != null)
                jewel.gameObject.SetActive(false);
        }
    }

    private Color GetColorForJewelType(int type)
    {
        return type switch
        {
            1 => redColor,
            2 => greenColor,
            3 => blueColor,
            4 => yellowColor,
            5 => orangeColor,
            6 => purpleColor,
            _ => Color.gray
        };
    }

    public int GetPlayerId()
    {
        return currentPlayerId;
    }
}